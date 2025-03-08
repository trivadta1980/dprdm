1:import { useQuery, useMutation } from "@tanstack/react-query";
2:import { useState } from "react";
3:import { MainLayout } from "@/components/layout/main-layout";
4:import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
5:import {
6:  Table,
7:  TableBody,
8:  TableCell,
9:  TableHead,
10: TableHeader,
11: TableRow,
12:} from "@/components/ui/table";
13:import { Button } from "@/components/ui/button";
14:import {
15:  Dialog,
16:  DialogContent,
17:  DialogHeader,
18:  DialogTitle,
19:  DialogTrigger,
20:} from "@/components/ui/dialog";
21:import {
22:  Select,
23:  SelectContent,
24:  SelectItem,
25:  SelectTrigger,
26:  SelectValue,
27:} from "@/components/ui/select";
28:import { Plus, GitFork, Trash2, Upload, FileDown, Info } from "lucide-react";
29:import { useParams } from "wouter";
30:import { useToast } from "@/hooks/use-toast";
31:import { apiRequest, queryClient } from "@/lib/queryClient";
32:import type {
33:  Relationship,
34:  ReferenceDataSet,
35:  RelationshipValue,
36:  RelationshipAttributeDefinition,
37:  RelationshipAttributeValue,
38:} from "@shared/schema";
39:
40:export default function RelationshipValuesPage() {
41:  const { id } = useParams<{ id: string }>();
42:  const { toast } = useToast();
43:  const [isDialogOpen, setIsDialogOpen] = useState(false);
44:  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
45:  const [selectedSource, setSelectedSource] = useState<string | null>(null);
46:  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
47:  const [csvFile, setCsvFile] = useState<File | null>(null);
48:  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
49:  const [selectedValueId, setSelectedValueId] = useState<number | null>(null);
50:  const [columnMapping, setColumnMapping] = useState<{
51:    sourceInstanceId?: string;
52:    targetInstanceId?: string;
53:    attributes: Record<number, string>;
54:  }>({
55:    attributes: {},
56:  });
57:
58:  // Fetch relationship details
59:  const { data: relationship } = useQuery<Relationship>({
60:    queryKey: [`/api/relationships/${id}`],
61:    enabled: !!id,
62:  });
63:
64:  // Fetch relationship values
65:  const { data: values = [] } = useQuery<RelationshipValue[]>({
66:    queryKey: [`/api/relationships/${id}/values`],
67:    enabled: !!id,
68:  });
69:
70:  // Fetch source and target datasets
71:  const { data: sourceDataSet } = useQuery<ReferenceDataSet>({
72:    queryKey: [`/api/reference-data/${relationship?.sourceDataSetId}`],
73:    enabled: !!relationship?.sourceDataSetId,
74:  });
75:
76:  const { data: targetDataSet } = useQuery<ReferenceDataSet>({
77:    queryKey: [`/api/reference-data/${relationship?.targetDataSetId}`],
78:    enabled: !!relationship?.targetDataSetId,
79:  });
80:
81:  // Fetch available targets for selected source
82:  const { data: availableTargets = [] } = useQuery<Array<{ id: string; [key: string]: any }>>({
83:    queryKey: [`/api/relationships/${id}/values/available-targets`, selectedSource],
84:    queryFn: async () => {
85:      if (!selectedSource) return [];
86:      const response = await apiRequest(`/api/relationships/${id}/values/available-targets?sourceId=${selectedSource}`, {
87:        method: 'GET'
88:      });
89:      return response.json();
90:    },
91:    enabled: !!selectedSource,
92:  });
93:
94:
95:  // Fetch attribute definitions
96:  const { data: attributeDefinitions = [] } = useQuery<RelationshipAttributeDefinition[]>({
97:    queryKey: [`/api/relationships/${id}/attribute-definitions`],
98:    enabled: !!id,
99:  });
100:
101:  // Add new query for attribute values
102:  const { data: attributeValues = [] } = useQuery<RelationshipAttributeValue[]>({
103:    queryKey: [`/api/relationships/${id}/values/${selectedValueId}/attributes`],
104:    enabled: !!selectedValueId,
105:  });
106:
107:  // Handle CSV file upload
108:  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
109:    const file = event.target.files?.[0];
110:    if (!file) return;
111:
112:    setCsvFile(file);
113:
114:    // Read CSV headers
115:    const reader = new FileReader();
116:    reader.onload = (e) => {
117:      const text = e.target?.result as string;
118:      const headers = text.split('\n')[0].split(',').map(h => h.trim());
119:      setCsvHeaders(headers);
120:    };
121:    reader.readAsText(file);
122:  };
123:
124:  // Handle column mapping change
125:  const handleMappingChange = (field: string, value: string | null) => {
126:    if (!value) return;
127:
128:    if (field.startsWith('attribute_')) {
129:      const attributeId = Number(field.replace('attribute_', ''));
130:      setColumnMapping(prev => ({
131:        ...prev,
132:        attributes: {
133:          ...prev.attributes,
134:          [attributeId]: value === 'none' ? undefined : value,
135:        },
136:      }));
137:    } else {
138:      setColumnMapping(prev => ({
139:        ...prev,
140:        [field]: value,
141:      }));
142:    }
143:  };
144:
145:  // Import mutation
146:  const importMutation = useMutation({
147:    mutationFn: async () => {
148:      if (!csvFile || !columnMapping.sourceInstanceId || !columnMapping.targetInstanceId) {
149:        throw new Error("Please select mapping for required fields");
150:      }
151:
152:      const formData = new FormData();
153:      formData.append('file', csvFile);
154:      formData.append('mapping', JSON.stringify(columnMapping));
155:
156:      const response = await fetch(`/api/relationships/${id}/values/import`, {
157:        method: 'POST',
158:        body: formData,
159:        credentials: 'include',
160:      });
161:
162:      if (!response.ok) {
163:        const error = await response.json();
164:        throw new Error(error.message || 'Import failed');
165:      }
166:
167:      return response.json();
168:    },
169:    onSuccess: () => {
170:      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
171:      setIsImportDialogOpen(false);
172:      setCsvFile(null);
173:      setCsvHeaders([]);
174:      setColumnMapping({ attributes: {} });
175:      toast({
176:        title: "Success",
177:        description: "Relationship values imported successfully",
178:      });
179:    },
180:    onError: (error: Error) => {
181:      toast({
182:        title: "Error",
183:        description: error.message || "Failed to import relationship values",
184:        variant: "destructive",
185:      });
186:    },
187:  });
188:
189:  // Create relationship value mutation
190:  const createMutation = useMutation({
191:    mutationFn: async () => {
192:      if (!selectedSource || !selectedTarget) return;
193:
194:      const response = await apiRequest(`/api/relationships/${id}/values`, {
195:        method: "POST",
196:        data: {
197:          relationshipId: Number(id),
198:          sourceInstanceId: selectedSource,
199:          targetInstanceId: selectedTarget,
200:        }
201:      });
202:      return response.json();
203:    },
204:    onSuccess: () => {
205:      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
206:      setIsDialogOpen(false);
207:      setSelectedSource(null);
208:      setSelectedTarget(null);
209:      toast({
210:        title: "Success",
211:        description: "Relationship value created successfully",
212:      });
213:    },
214:    onError: (error: Error) => {
215:      toast({
216:        title: "Error",
217:        description: error.message || "Failed to create relationship value",
218:        variant: "destructive",
219:      });
220:    },
221:  });
222:
223:  // Delete relationship value mutation
224:  const deleteMutation = useMutation({
225:    mutationFn: async (valueId: number) => {
226:      await apiRequest(`/api/relationships/${id}/values/${valueId}`, {
227:        method: "DELETE"
228:      });
229:    },
230:    onSuccess: () => {
231:      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${id}/values`] });
232:      toast({
233:        title: "Success",
234:        description: "Relationship value deleted successfully",
235:      });
236:    },
237:    onError: (error: Error) => {
238:      toast({
239:        title: "Error",
240:        description: error.message || "Failed to delete relationship value",
241:        variant: "destructive",
242:      });
243:    },
244:  });
245:
246:  function handleDelete(valueId: number) {
247:    if (window.confirm("Are you sure you want to delete this relationship value?")) {
248:      deleteMutation.mutate(valueId);
249:    }
250:  }
251:
252:  function getInstanceDisplayValue(
253:    instanceId: string,
254:    dataSet?: ReferenceDataSet,
255:    field?: string
256:  ): string {
257:    if (!dataSet || !field) return instanceId;
258:    const instance = dataSet.data[instanceId];
259:    return instance && field in instance ? String(instance[field]) : instanceId;
260:  }
261:
262:  // Show loading state if any of the required data is still loading
263:  if (!relationship || !sourceDataSet || !targetDataSet || !attributeDefinitions) {
264:    return (
265:      <MainLayout>
266:        <div className="flex justify-center items-center h-screen">
267:          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
268:        </div>
269:      </MainLayout>
270:    );
271:  }
272:
273:  // Show error state if relationship is not found
274:  if (!relationship) {
275:    return (
276:      <MainLayout>
277:        <div className="max-w-6xl mx-auto">
278:          <Card>
279:            <CardHeader>
280:              <CardTitle className="text-red-600">Error</CardTitle>
281:            </CardHeader>
282:            <CardContent>
283:              <p>Relationship not found or you don't have permission to view it.</p>
284:            </CardContent>
285:          </Card>
286:        </div>
287:      </MainLayout>
288:    );
289:  }
290:
291:  return (
292:    <MainLayout>
293:      <div className="max-w-6xl mx-auto space-y-6">
294:        <Card>
295:          <CardHeader className="flex flex-row items-center justify-between">
296:            <CardTitle className="flex items-center gap-2">
297:              <GitFork className="h-5 w-5" />
298:              Relationship Values: {relationship?.name}
299:            </CardTitle>
300:            <div className="flex gap-2">
301:              <Button variant="outline" onClick={() => {
302:                // Create and download template CSV
303:                const headers = ['source_instance_id', 'target_instance_id'];
304:
305:                // Add attribute columns to headers
306:                if (attributeDefinitions) {
307:                  attributeDefinitions.forEach(attr => {
308:                    headers.push(`attribute_${attr.name.toLowerCase().replace(/\s+/g, '_')}`);
309:                  });
310:                }
311:
312:                // Create CSV content
313:                const csvContent = headers.join(',');
314:                const blob = new Blob([csvContent], { type: 'text/csv' });
315:                const url = window.URL.createObjectURL(blob);
316:                const a = document.createElement('a');
317:                a.href = url;
318:                a.download = `${relationship?.name || 'relationship'}_template.csv`;
319:                document.body.appendChild(a);
320:                a.click();
321:                document.body.removeChild(a);
322:                window.URL.revokeObjectURL(url);
323:              }}>
324:                <FileDown className="h-4 w-4 mr-2" />
325:                Export Template
326:              </Button>
327:
328:              <Dialog
329:                open={isImportDialogOpen}
330:                onOpenChange={setIsImportDialogOpen}
331:              >
332:                <DialogTrigger asChild>
333:                  <Button variant="outline">
334:                    <Upload className="h-4 w-4 mr-2" />
335:                    Import Values
336:                  </Button>
337:                </DialogTrigger>
338:                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
339:                  <DialogHeader>
340:                    <DialogTitle>Import Relationship Values</DialogTitle>
341:                  </DialogHeader>
342:                  <div className="flex-1 overflow-y-auto pr-2">
343:                    <div className="space-y-4">
344:                      <div>
345:                        <label className="text-sm font-medium">Upload CSV</label>
346:                        <input
347:                          type="file"
348:                          accept=".csv"
349:                          onChange={handleFileChange}
350:                          className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
351:                        />
352:                      </div>
353:
354:                      {csvHeaders.length > 0 && (
355:                        <div className="space-y-4">
356:                          <div>
357:                            <label className="text-sm font-medium">Source Instance ID Column</label>
358:                            <Select
359:                              value={columnMapping.sourceInstanceId}
360:                              onValueChange={(value) => handleMappingChange('sourceInstanceId', value)}
361:                            >
362:                              <SelectTrigger>
363:                                <SelectValue placeholder="Select column" />
364:                              </SelectTrigger>
365:                              <SelectContent>
366:                                {csvHeaders.map((header) => (
367:                                  <SelectItem key={header} value={header}>
368:                                    {header}
369:                                  </SelectItem>
370:                                ))}
371:                              </SelectContent>
372:                            </Select>
373:                          </div>
374:
375:                          <div>
376:                            <label className="text-sm font-medium">Target Instance ID Column</label>
377:                            <Select
378:                              value={columnMapping.targetInstanceId}
379:                              onValueChange={(value) => handleMappingChange('targetInstanceId', value)}
380:                            >
381:                              <SelectTrigger>
382:                                <SelectValue placeholder="Select column" />
383:                              </SelectTrigger>
384:                              <SelectContent>
385:                                {csvHeaders.map((header) => (
386:                                  <SelectItem key={header} value={header}>
387:                                    {header}
388:                                  </SelectItem>
389:                                ))}
390:                              </SelectContent>
391:                            </Select>
392:                          </div>
393:
394:                          {attributeDefinitions.length > 0 && (
395:                            <div>
396:                              <h3 className="text-sm font-medium mb-2">Attribute Mappings</h3>
397:                              <div className="space-y-2">
398:                                {attributeDefinitions.map((attr) => (
399:                                  <div key={attr.id}>
400:                                    <label className="text-sm">{attr.name}</label>
401:                                    <Select
402:                                      value={columnMapping.attributes[attr.id] || 'none'}
403:                                      onValueChange={(value) => handleMappingChange(`attribute_${attr.id}`, value)}
404:                                    >
405:                                      <SelectTrigger>
406:                                        <SelectValue placeholder="Select column (optional)" />
407:                                      </SelectTrigger>
408:                                      <SelectContent>
409:                                        <SelectItem value="none">No mapping</SelectItem>
410:                                        {csvHeaders.map((header) => (
411:                                          <SelectItem key={header} value={header}>
412:                                            {header}
413:                                          </SelectItem>
414:                                        ))}
415:                                      </SelectContent>
416:                                    </Select>
417:                                  </div>
418:                                ))}
419:                              </div>
420:                            </div>
421:                          )}
422:                        </div>
423:                      )}
424:                    </div>
425:                  </div>
426:                  <div className="flex justify-end pt-4 mt-4 border-t">
427:                    <Button
428:                      onClick={() => importMutation.mutate()}
429:                      disabled={!columnMapping.sourceInstanceId || !columnMapping.targetInstanceId}
430:                    >
431:                      Import Values
432:                    </Button>
433:                  </div>
434:                </DialogContent>
435:
436:              <Dialog
437:                open={isDialogOpen}
438:                onOpenChange={(open) => {
439:                  if (!open) {
440:                    setSelectedSource(null);
441:                    setSelectedTarget(null);
442:                  }
443:                  setIsDialogOpen(open);
444:                }}
445:              >
446:                <DialogTrigger asChild>
447:                  <Button>
448:                    <Plus className="h-4 w-4 mr-2" />
449:                    New Value
450:                  </Button>
451:                </DialogTrigger>
452:                <DialogContent>
453:                  <DialogHeader>
454:                    <DialogTitle>Create New Relationship Value</DialogTitle>
455:                  </DialogHeader>
456:                  <div className="space-y-4 pt-4">
457:                    <div>
458:                      <label className="text-sm font-medium">Source Instance</label>
459:                      <Select
460:                        value={selectedSource || ""}
461:                        onValueChange={setSelectedSource}
462:                      >
463:                        <SelectTrigger>
464:                          <SelectValue placeholder="Select source instance" />
465:                        </SelectTrigger>
466:                        <SelectContent>
467:                          {sourceDataSet && Object.entries(sourceDataSet.data).map(([id, data]) => (
468:                            <SelectItem key={id} value={id}>
469:                              {getInstanceDisplayValue(id, sourceDataSet, relationship?.sourceField)}
470:                            </SelectItem>
471:                          ))}
472:                        </SelectContent>
473:                      </Select>
474:                    </div>
475:                    <div>
476:                      <label className="text-sm font-medium">Target Instance</label>
477:                      <Select
478:                        value={selectedTarget || ""}
479:                        onValueChange={setSelectedTarget}
480:                        disabled={!selectedSource}
481:                      >
482:                        <SelectTrigger>
483:                          <SelectValue placeholder="Select target instance" />
484:                        </SelectTrigger>
485:                        <SelectContent>
486:                          {availableTargets.map((target) => (
487:                            <SelectItem key={target.id} value={target.id}>
488:                              {getInstanceDisplayValue(
489:                                target.id,
490:                                targetDataSet,
491:                                relationship?.targetField
492:                              )}
493:                            </SelectItem>
494:                          ))}
495:                        </SelectContent>
496:                      </Select>
497:                    </div>
498:                    <Button
499:                      className="w-full"
500:                      onClick={() => createMutation.mutate()}
501:                      disabled={!selectedSource || !selectedTarget}
502:                    >
503:                      Create Relationship Value
504:                    </Button>
505:                  </div>
506:                </DialogContent>
507:              </Dialog>
508:            </div>
509:          </CardHeader>
510:          <CardContent>
511:            {values.length > 0 ? (
512:              <Table>
513:                <TableHeader>
514:                  <TableRow>
515:                    <TableHead>Source Instance</TableHead>
516:                    <TableHead>Target Instance</TableHead>
517:                    <TableHead className="text-right">Actions</TableHead>
518:                  </TableRow>
519:                </TableHeader>
520:                <TableBody>
521:                  {values.map((value) => (
522:                    <TableRow key={value.id}>
523:                      <TableCell>
524:                        {getInstanceDisplayValue(
525:                          value.sourceInstanceId,
526:                          sourceDataSet,
527:                          relationship?.sourceField
528:                        )}
529:                      </TableCell>
530:                      <TableCell>
531:                        {getInstanceDisplayValue(
532:                          value.targetInstanceId,
533:                          targetDataSet,
534:                          relationship?.targetField
535:                        )}
536:                      </TableCell>
537:                      <TableCell className="text-right space-x-2">
538:                        <Dialog onOpenChange={(open) => {
539:                          if (open) {
540:                            setSelectedValueId(value.id);
541:                          } else {
542:                            setSelectedValueId(null);
543:                          }
544:                        }}>
545:                          <DialogTrigger asChild>
546:                            <Button
547:                              variant="ghost"
548:                              size="sm"
549:                              className="hover:bg-blue-50"
550:                            >
551:                              <Info className="h-4 w-4 text-blue-600" />
552:                            </Button>
553:                          </DialogTrigger>
554:                          <DialogContent>
555:                            <DialogHeader>
556:                              <DialogTitle>Attribute Values</DialogTitle>
557:                            </DialogHeader>
558:                            <div className="space-y-4">
559:                              <div>
560:                                <h3 className="text-sm font-medium mb-2">Relationship Details</h3>
561:                                <div className="space-y-2">
562:                                  <p>
563:                                    <span className="font-medium">Source:</span>{" "}
564:                                    {getInstanceDisplayValue(
565:                                      value.sourceInstanceId,
566:                                      sourceDataSet,
567:                                      relationship?.sourceField
568:                                    )}
569:                                  </p>
570:                                  <p>
571:                                    <span className="font-medium">Target:</span>{" "}
572:                                    {getInstanceDisplayValue(
573:                                      value.targetInstanceId,
574:                                      targetDataSet,
575:                                      relationship?.targetField
576:                                    )}
577:                                  </p>
578:                                </div>
579:                              </div>
580:                              <div>
581:                                <h3 className="text-sm font-medium mb-2">Attributes</h3>
582:                                {attributeValues.length > 0 ? (
583:                                  <Table>
584:                                    <TableHeader>
585:                                      <TableRow>
586:                                        <TableHead>Attribute</TableHead>
587:                                        <TableHead>Value</TableHead>
588:                                      </TableRow>
589:                                    </TableHeader>
590:                                    <TableBody>
591:                                      {attributeValues.map((attrValue) => {
592:                                        const definition = attributeDefinitions.find(
593:                                          (def) => def.id === attrValue.attributeDefinitionId
594:                                        );
595:                                        return (
596:                                          <TableRow key={attrValue.id}>
597:                                            <TableCell>{definition?.name || 'Unknown'}</TableCell>
598:                                            <TableCell>{attrValue.value}</TableCell>
599:                                          </TableRow>
600:                                        );
601:                                      })}
602:                                    </TableBody>
603:                                  </Table>
604:                                ) : (
605:                                  <p className="text-gray-500">No attribute values defined.</p>
606:                                )}
607:                              </div>
608:                            </div>
609:                          </DialogContent>
610:                        </Dialog>
611:                        <Button
612:                          variant="ghost"
613:                          size="sm"
614:                          onClick={() => handleDelete(value.id)}
615:                          className="hover:bg-red-50"
616:                        >
617:                          <Trash2 className="h-4 w-4 text-red-600" />
618:                        </Button>
619:                      </TableCell>
620:                    </TableRow>
621:                  ))}
622:                </TableBody>
623:              </Table>
624:            ) : (
625:              <div className="text-center py-8 text-gray-500">
626:                <GitFork className="h-12 w-12 mx-auto mb-4 text-gray-400" />
627:                <p>No relationship values defined yet.</p>
628:                <p className="text-sm">Click the "New Value" button to create one.</p>
629:              </div>
630:            )}
631:          </CardContent>
632:        </Card>
633:      </div>
634:    </MainLayout>
635:  );
636:}