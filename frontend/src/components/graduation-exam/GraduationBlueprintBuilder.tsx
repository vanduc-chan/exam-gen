import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BlueprintSection,
  BlueprintSlot,
  SlotSourceType,
  SubjectAvailabilityItemResponse,
} from '@/types/graduationExam';
import { Subject } from '@/types/subject';
import { Question, QuestionType } from '@/types/question';
import { graduationExamService } from '@/services/graduationExamService';
import { questionService } from '@/services/questionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckSquare,
  Shuffle,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  X,
} from 'lucide-react';

interface GraduationBlueprintBuilderProps {
  sections: BlueprintSection[];
  onChange: (sections: BlueprintSection[]) => void;
  subjects: Subject[];
  courseIds: string[];
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

const GraduationBlueprintBuilderInner: React.FC<GraduationBlueprintBuilderProps> = ({
  sections,
  onChange,
  subjects,
  courseIds,
}) => {
  // Batch availability map keyed by subjectId
  const [subjectAvailabilityMap, setSubjectAvailabilityMap] = useState<
    Record<string, SubjectAvailabilityItemResponse>
  >({});

  // Subject search & filter state
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [showAllMatchingSubjects, setShowAllMatchingSubjects] = useState(false);

  // Drag & drop state
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [draggedSlotInfo, setDraggedSlotInfo] = useState<{ secIdx: number; slotIdx: number } | null>(
    null
  );

  // Question picker modal state for BANK_PICKED / BANK_FIXED
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activePickerTarget, setActivePickerTarget] = useState<{
    secIdx: number;
    slotIdx: number;
  } | null>(null);
  const [pickerQuestions, setPickerQuestions] = useState<Question[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSubjectId, setPickerSubjectId] = useState<string>('');
  const [pickerType, setPickerType] = useState<string>('ALL');
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // Memoize subject options for SearchableSelect so they aren't recreated on every render
  const subjectSelectOptions = useMemo(
    () =>
      subjects.map((s) => ({
        value: s.id,
        label: `${s.subjectName} (${s.subjectCode})`,
        subLabel: s.subjectCode,
      })),
    [subjects]
  );

  const sectionSubjectSelectOptions = useMemo(
    () => [
      { value: 'NONE', label: '-- Đa môn / Tự chọn --' },
      ...subjectSelectOptions,
    ],
    [subjectSelectOptions]
  );

  const subjectByIdMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Distinct subject IDs currently used across all sections & slots
  const distinctSubjectIds = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((sec) => {
      if (sec.subjectId) set.add(sec.subjectId);
      (sec.slots || []).forEach((slot) => {
        const subId = slot.subjectId || sec.subjectId;
        if (subId) set.add(subId);
      });
    });
    return Array.from(set).sort();
  }, [sections]);

  const distinctSubjectsKey = distinctSubjectIds.join(',');
  const coursesKey = useMemo(() => [...(courseIds || [])].sort().join(','), [courseIds]);

  // Single Batch API call when selected subjects or selected courses change
  useEffect(() => {
    if (!coursesKey || !distinctSubjectsKey) {
      setSubjectAvailabilityMap({});
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await graduationExamService.checkBatchAvailability({
          courseIds,
          subjectIds: distinctSubjectIds,
        });
        if (!isCancelled && res.data) {
          setSubjectAvailabilityMap(res.data);
        }
      } catch (_) {
        if (!isCancelled) {
          setSubjectAvailabilityMap({});
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [coursesKey, distinctSubjectsKey]);

  const reindexSections = useCallback((list: BlueprintSection[]): BlueprintSection[] => {
    return list.map((sec, sIdx) => ({
      ...sec,
      sectionOrder: sIdx + 1,
      slots: (sec.slots || []).map((slot, slotIdx) => ({
        ...slot,
        slotOrder: slotIdx + 1,
      })),
    }));
  }, []);

  // Selected subjects list (derived from sections)
  const selectedSubjectIdsSet = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => {
      if (s.subjectId) set.add(s.subjectId);
    });
    return set;
  }, [sections]);

  const selectedSubjectsList = useMemo(() => {
    const list: Subject[] = [];
    const seen = new Set<string>();
    sections.forEach((s) => {
      if (s.subjectId && !seen.has(s.subjectId)) {
        const sub = subjectByIdMap.get(s.subjectId);
        if (sub) {
          seen.add(sub.id);
          list.push(sub);
        }
      }
    });
    return list;
  }, [sections, subjectByIdMap]);

  // Filtered subjects for the search box (capped at 12 unless expanded so DOM stays fast)
  const filteredSubjects = useMemo(() => {
    const q = subjectSearchQuery.trim().toLowerCase();
    if (!q) {
      return subjects;
    }
    return subjects.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q)
    );
  }, [subjects, subjectSearchQuery]);

  const displayedSubjects = useMemo(() => {
    if (showAllMatchingSubjects || subjectSearchQuery.trim().length > 0) {
      return filteredSubjects.slice(0, 36);
    }
    return filteredSubjects.slice(0, 12);
  }, [filteredSubjects, showAllMatchingSubjects, subjectSearchQuery]);

  // Toggle subject in quick multi-subject bar
  const handleToggleQuickSubject = useCallback(
    (subject: Subject) => {
      const existingIdx = sections.findIndex((s) => s.subjectId === subject.id);
      if (existingIdx >= 0) {
        if (sections.length <= 1) return; // Keep at least 1 section
        const next = sections.filter((_, idx) => idx !== existingIdx);
        onChange(reindexSections(next));
      } else {
        const newSecOrder = sections.length + 1;
        const newSection: BlueprintSection = {
          id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sectionOrder: newSecOrder,
          title: `Phần ${newSecOrder}: ${subject.subjectName}`,
          subjectId: subject.id,
          subjectName: subject.subjectName,
          slots: [
            {
              id: `slot-${Date.now()}-1`,
              slotOrder: 1,
              sourceType: SlotSourceType.BANK_RANDOM,
              subjectId: subject.id,
              subjectName: subject.subjectName,
              questionType: QuestionType.LY_THUYET,
              questionCount: 1,
              questionIds: [],
            },
            {
              id: `slot-${Date.now()}-2`,
              slotOrder: 2,
              sourceType: SlotSourceType.BANK_RANDOM,
              subjectId: subject.id,
              subjectName: subject.subjectName,
              questionType: QuestionType.THUC_HANH,
              questionCount: 1,
              questionIds: [],
            },
          ],
        };
        onChange(reindexSections([...sections, newSection]));
      }
    },
    [sections, onChange, reindexSections]
  );

  const handleAddSection = useCallback(() => {
    const defaultSubject = subjects[0];
    const nextOrder = sections.length + 1;
    const newSection: BlueprintSection = {
      id: `sec-${Date.now()}`,
      sectionOrder: nextOrder,
      title: defaultSubject ? `Phần ${nextOrder}: ${defaultSubject.subjectName}` : `Phần ${nextOrder}`,
      subjectId: defaultSubject?.id,
      subjectName: defaultSubject?.subjectName,
      slots: [
        {
          id: `slot-${Date.now()}-1`,
          slotOrder: 1,
          sourceType: SlotSourceType.BANK_RANDOM,
          subjectId: defaultSubject?.id,
          subjectName: defaultSubject?.subjectName,
          questionType: QuestionType.LY_THUYET,
          questionCount: 1,
          questionIds: [],
        },
      ],
    };
    onChange(reindexSections([...sections, newSection]));
  }, [subjects, sections, onChange, reindexSections]);

  const handleRemoveSection = useCallback(
    (secIdx: number) => {
      if (sections.length <= 1) return;
      const next = sections.filter((_, i) => i !== secIdx);
      onChange(reindexSections(next));
    },
    [sections, onChange, reindexSections]
  );

  const handleMoveSection = useCallback(
    (secIdx: number, direction: -1 | 1) => {
      const targetIdx = secIdx + direction;
      if (targetIdx < 0 || targetIdx >= sections.length) return;
      const next = [...sections];
      const [moved] = next.splice(secIdx, 1);
      next.splice(targetIdx, 0, moved);
      onChange(reindexSections(next));
    },
    [sections, onChange, reindexSections]
  );

  const handleUpdateSection = useCallback(
    (secIdx: number, patch: Partial<BlueprintSection>) => {
      const next = [...sections];
      const updatedSec = { ...next[secIdx], ...patch };
      if (patch.subjectId !== undefined) {
        const subObj = patch.subjectId ? subjectByIdMap.get(patch.subjectId) : undefined;
        updatedSec.subjectName = subObj?.subjectName;
        if (subObj) {
          updatedSec.title = `Phần ${secIdx + 1}: ${subObj.subjectName}`;
          updatedSec.slots = (updatedSec.slots || []).map((sl) => ({
            ...sl,
            subjectId: patch.subjectId,
            subjectName: subObj.subjectName,
          }));
        }
      }
      next[secIdx] = updatedSec;
      onChange(reindexSections(next));
    },
    [sections, subjectByIdMap, onChange, reindexSections]
  );

  const handleAddSlot = useCallback(
    (secIdx: number) => {
      const next = [...sections];
      const sec = next[secIdx];
      const newSlot: BlueprintSlot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        slotOrder: (sec.slots?.length || 0) + 1,
        sourceType: SlotSourceType.BANK_RANDOM,
        subjectId: sec.subjectId || subjects[0]?.id,
        subjectName: sec.subjectName || subjects[0]?.subjectName,
        questionType: QuestionType.LY_THUYET,
        questionCount: 1,
        questionIds: [],
      };
      next[secIdx] = {
        ...sec,
        slots: [...(sec.slots || []), newSlot],
      };
      onChange(reindexSections(next));
    },
    [sections, subjects, onChange, reindexSections]
  );

  const handleRemoveSlot = useCallback(
    (secIdx: number, slotIdx: number) => {
      const next = [...sections];
      const sec = next[secIdx];
      if ((sec.slots?.length || 0) <= 1) return;
      next[secIdx] = {
        ...sec,
        slots: sec.slots.filter((_, i) => i !== slotIdx),
      };
      onChange(reindexSections(next));
    },
    [sections, onChange, reindexSections]
  );

  const handleMoveSlot = useCallback(
    (secIdx: number, slotIdx: number, direction: -1 | 1) => {
      const next = [...sections];
      const sec = next[secIdx];
      const slots = [...(sec.slots || [])];
      const targetIdx = slotIdx + direction;
      if (targetIdx < 0 || targetIdx >= slots.length) return;
      const [moved] = slots.splice(slotIdx, 1);
      slots.splice(targetIdx, 0, moved);
      next[secIdx] = { ...sec, slots };
      onChange(reindexSections(next));
    },
    [sections, onChange, reindexSections]
  );

  const handleUpdateSlot = useCallback(
    (secIdx: number, slotIdx: number, patch: Partial<BlueprintSlot>) => {
      const next = [...sections];
      const sec = next[secIdx];
      const slots = [...(sec.slots || [])];
      const updatedSlot = { ...slots[slotIdx], ...patch };
      if (patch.subjectId) {
        const subObj = subjectByIdMap.get(patch.subjectId);
        updatedSlot.subjectName = subObj?.subjectName;
      }
      if (updatedSlot.sourceType === SlotSourceType.BANK_FIXED && updatedSlot.questionIds?.length) {
        updatedSlot.questionCount = updatedSlot.questionIds.length;
      }
      slots[slotIdx] = updatedSlot;
      next[secIdx] = { ...sec, slots };
      onChange(reindexSections(next));
    },
    [sections, subjectByIdMap, onChange, reindexSections]
  );

  // Question Picker Modal handlers
  const openQuestionPicker = (secIdx: number, slotIdx: number) => {
    const sec = sections[secIdx];
    const slot = sec.slots[slotIdx];
    const initialSubId = slot.subjectId || sec.subjectId || subjects[0]?.id || '';
    setActivePickerTarget({ secIdx, slotIdx });
    setPickerSubjectId(initialSubId);
    setPickerType(slot.questionType || 'ALL');
    setPickerSearch('');
    setTempSelectedIds([...(slot.questionIds || [])]);
    setPickerOpen(true);
  };

  useEffect(() => {
    if (!pickerOpen) return;
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setPickerLoading(true);
        const res = await questionService.getQuestions({
          page: 0,
          size: 100,
          subjectId: pickerSubjectId || undefined,
          type: pickerType !== 'ALL' ? (pickerType as QuestionType) : undefined,
          search: pickerSearch || undefined,
        });
        if (!isCancelled) {
          setPickerQuestions(res.data.content || []);
        }
      } catch (_) {
        if (!isCancelled) setPickerQuestions([]);
      } finally {
        if (!isCancelled) setPickerLoading(false);
      }
    }, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [pickerOpen, pickerSubjectId, pickerType, pickerSearch]);

  const togglePickQuestion = (qId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const savePickedQuestions = () => {
    if (!activePickerTarget) return;
    const { secIdx, slotIdx } = activePickerTarget;
    const slot = sections[secIdx].slots[slotIdx];
    const newCount =
      slot.sourceType === SlotSourceType.BANK_FIXED
        ? Math.max(1, tempSelectedIds.length)
        : Math.min(Math.max(1, slot.questionCount), Math.max(1, tempSelectedIds.length));

    handleUpdateSlot(secIdx, slotIdx, {
      questionIds: tempSelectedIds,
      questionCount: newCount,
      subjectId: pickerSubjectId || slot.subjectId,
    });
    setPickerOpen(false);
  };

  // Compute continuous question numbers across all sections & slots
  const { slotQuestionRanges, totalQuestions } = useMemo(() => {
    let runningQuestionNum = 1;
    const ranges: Record<string, string> = {};
    let totalQ = 0;

    sections.forEach((sec, sIdx) => {
      (sec.slots || []).forEach((slot, slotIdx) => {
        const count = Math.max(1, Number(slot.questionCount) || 1);
        const start = runningQuestionNum;
        const end = runningQuestionNum + count - 1;
        ranges[`${sIdx}_${slotIdx}`] = start === end ? `Câu ${start}` : `Câu ${start} - ${end}`;
        runningQuestionNum += count;
        totalQ += count;
      });
    });

    return { slotQuestionRanges: ranges, totalQuestions: totalQ };
  }, [sections]);

  const estimatedPerPage = totalQuestions >= 5 ? 2 : totalQuestions >= 3 ? 3 : 4;

  // Helper to get slot availability from the single batch response
  const getSlotAvailabilityInfo = (subjectId: string, questionType?: QuestionType | null) => {
    if (!courseIds || courseIds.length === 0 || !subjectId) return null;
    const item = subjectAvailabilityMap[subjectId];
    if (!item) return null;
    if (!item.valid) {
      return {
        valid: false,
        availableCount: 0,
        message: item.message,
      };
    }
    const typeKey = questionType || 'ALL';
    const count = item.countByType?.[typeKey] ?? 0;
    return {
      valid: count > 0,
      availableCount: count,
      message: `Kho có ${count} câu phù hợp`,
    };
  };

  return (
    <div className="space-y-5">
      {/* 1. Searchable Quick Multi-Subject Selector & Selected Subjects Display */}
      <div className="rounded-lg border bg-slate-50/90 p-4 space-y-3.5">
        {/* Selected Subjects Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Các môn học đã chọn trong đề ({selectedSubjectsList.length} môn):
            </span>
            <span className="text-xs text-muted-foreground">
              Bấm vào dấu × để gỡ môn học hoặc kéo thả các Phần bên dưới để đổi thứ tự
            </span>
          </div>

          {selectedSubjectsList.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2.5 bg-white rounded-md border border-slate-200">
              {selectedSubjectsList.map((sub) => (
                <Badge
                  key={sub.id}
                  variant="default"
                  className="px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <span>
                    {sub.subjectName} ({sub.subjectCode})
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleToggleQuickSubject(sub)}
                      className="ml-1 rounded-full hover:bg-white/20 p-0.5 transition-colors"
                      title="Gỡ môn học này khỏi đề"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic bg-white p-2.5 rounded-md border">
              Chưa chọn môn học nào. Hãy tìm và tick chọn môn học ở bên dưới.
            </div>
          )}
        </div>

        {/* Search & Pick Subjects */}
        <div className="space-y-2.5 pt-1 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">
              Tìm kiếm &amp; Tick chọn môn học đưa vào đề thi tốt nghiệp:
            </span>
            <div className="relative w-full sm:w-80">
              <Input
                value={subjectSearchQuery}
                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                placeholder="Gõ tên môn hoặc mã môn để tìm nhanh..."
                className="h-8 text-xs pl-8 bg-white"
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              {subjectSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSubjectSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
            {displayedSubjects.map((sub) => {
              const isSelected = selectedSubjectIdsSet.has(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleToggleQuickSubject(sub)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckSquare
                    className={`h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-40'}`}
                  />
                  <span>{sub.subjectName}</span>
                  <span className="opacity-70">({sub.subjectCode})</span>
                </button>
              );
            })}
            {filteredSubjects.length === 0 && (
              <span className="text-xs text-muted-foreground py-2">
                Không tìm thấy môn học nào khớp với từ khóa &ldquo;{subjectSearchQuery}&rdquo;.
              </span>
            )}
          </div>

          {!subjectSearchQuery && filteredSubjects.length > 12 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Đang hiển thị {displayedSubjects.length} / {filteredSubjects.length} môn học (Hãy dùng ô tìm kiếm để lọc nhanh).
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setShowAllMatchingSubjects((prev) => !prev)}
              >
                {showAllMatchingSubjects ? 'Thu gọn danh sách môn' : 'Xem thêm môn học'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sections & Slots Interactive List */}
      <div className="space-y-4">
        {sections.map((section, secIdx) => (
          <div
            key={section.id || secIdx}
            draggable
            onDragStart={() => setDraggedSectionIdx(secIdx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedSectionIdx !== null && draggedSectionIdx !== secIdx) {
                const next = [...sections];
                const [moved] = next.splice(draggedSectionIdx, 1);
                next.splice(secIdx, 0, moved);
                onChange(reindexSections(next));
              }
              setDraggedSectionIdx(null);
            }}
            className="rounded-lg border bg-white shadow-sm overflow-hidden transition-all"
          >
            {/* Section Header */}
            <div className="bg-slate-100/90 px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div
                  className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                  title="Kéo thả để đổi thứ tự Phần thi"
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                <Badge variant="default" className="shrink-0">
                  Phần {secIdx + 1}
                </Badge>
                <Input
                  value={section.title}
                  onChange={(e) => handleUpdateSection(secIdx, { title: e.target.value })}
                  placeholder={`Tên phần thi (VD: Phần ${secIdx + 1}: Kỹ thuật Công binh)`}
                  className="h-8 bg-white font-medium text-sm max-w-xs sm:max-w-sm"
                />
                <div className="w-64">
                  <SearchableSelect
                    options={sectionSubjectSelectOptions}
                    value={section.subjectId || 'NONE'}
                    onChange={(val) =>
                      handleUpdateSection(secIdx, {
                        subjectId: val === 'NONE' ? undefined : val,
                      })
                    }
                    placeholder="Chọn môn mặc định của phần..."
                    searchPlaceholder="Tìm môn học..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={secIdx === 0}
                  onClick={() => handleMoveSection(secIdx, -1)}
                  title="Di chuyển Phần này lên trên"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={secIdx === sections.length - 1}
                  onClick={() => handleMoveSection(secIdx, 1)}
                  title="Di chuyển Phần này xuống dưới"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs ml-1"
                  onClick={() => handleAddSlot(secIdx)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Thêm ô câu hỏi
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={sections.length <= 1}
                  onClick={() => handleRemoveSection(secIdx)}
                  title="Xóa Phần thi này"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Slots inside Section */}
            <div className="p-3 sm:p-4 space-y-3">
              {(section.slots || []).map((slot, slotIdx) => {
                const qRangeLabel = slotQuestionRanges[`${secIdx}_${slotIdx}`] || `Câu ?`;
                const effectiveSubId = slot.subjectId || section.subjectId || '';
                const avail = getSlotAvailabilityInfo(effectiveSubId, slot.questionType);
                const isRandom = slot.sourceType === SlotSourceType.BANK_RANDOM;
                const isPicked = slot.sourceType === SlotSourceType.BANK_PICKED;
                const isFixed = slot.sourceType === SlotSourceType.BANK_FIXED;
                const pickedCount = slot.questionIds?.length || 0;

                return (
                  <div
                    key={slot.id || slotIdx}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedSlotInfo({ secIdx, slotIdx });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      if (
                        draggedSlotInfo &&
                        draggedSlotInfo.secIdx === secIdx &&
                        draggedSlotInfo.slotIdx !== slotIdx
                      ) {
                        const next = [...sections];
                        const slots = [...next[secIdx].slots];
                        const [moved] = slots.splice(draggedSlotInfo.slotIdx, 1);
                        slots.splice(slotIdx, 0, moved);
                        next[secIdx] = { ...next[secIdx], slots };
                        onChange(reindexSections(next));
                      }
                      setDraggedSlotInfo(null);
                    }}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                        >
                          {qRangeLabel}
                        </Badge>

                        {/* Source Type Selector (3 sources: BANK_RANDOM, BANK_PICKED, BANK_FIXED) */}
                        <Select
                          value={slot.sourceType}
                          onValueChange={(val) =>
                            handleUpdateSlot(secIdx, slotIdx, {
                              sourceType: val as SlotSourceType,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[240px] bg-white text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SlotSourceType.BANK_RANDOM}>
                              <span className="inline-flex items-center gap-1.5">
                                <Shuffle className="h-3.5 w-3.5 text-blue-600" />
                                1. Ngẫu nhiên từ ngân hàng (BANK_RANDOM)
                              </span>
                            </SelectItem>
                            <SelectItem value={SlotSourceType.BANK_PICKED}>
                              <span className="inline-flex items-center gap-1.5">
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                                2. Chọn nhóm câu hỏi (BANK_PICKED)
                              </span>
                            </SelectItem>
                            <SelectItem value={SlotSourceType.BANK_FIXED}>
                              <span className="inline-flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-amber-600" />
                                3. Cố định câu hỏi (BANK_FIXED)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Availability Badge & Reorder/Delete Slot Buttons */}
                      <div className="flex items-center gap-1.5">
                        {isRandom && avail && (
                          <Badge
                            variant={
                              avail.valid && avail.availableCount >= slot.questionCount
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={`text-[11px] ${
                              avail.valid && avail.availableCount >= slot.questionCount
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ''
                            }`}
                          >
                            {avail.valid && avail.availableCount >= slot.questionCount ? (
                              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1 inline" />
                            )}
                            {avail.message}
                          </Badge>
                        )}

                        {(isPicked || isFixed) && (
                          <Badge
                            variant={
                              pickedCount >= (isFixed ? 1 : slot.questionCount)
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-[11px]"
                          >
                            Đã chọn {pickedCount} câu trong ngân hàng
                          </Badge>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={slotIdx === 0}
                          onClick={() => handleMoveSlot(secIdx, slotIdx, -1)}
                          title="Đưa câu này lên trên"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={slotIdx === section.slots.length - 1}
                          onClick={() => handleMoveSlot(secIdx, slotIdx, 1)}
                          title="Đưa câu này xuống dưới"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={section.slots.length <= 1}
                          onClick={() => handleRemoveSlot(secIdx, slotIdx)}
                          title="Xóa ô câu hỏi này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Slot Configuration Row (3 clean columns: Subject, QuestionType/Picker, QuestionCount) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      {/* 1. Subject selector (SearchableSelect for fast rendering) */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                          Môn học của câu
                        </label>
                        <SearchableSelect
                          options={subjectSelectOptions}
                          value={effectiveSubId}
                          onChange={(val) =>
                            handleUpdateSlot(secIdx, slotIdx, { subjectId: val })
                          }
                          placeholder="Chọn môn học..."
                          searchPlaceholder="Tìm môn học..."
                        />
                      </div>

                      {/* 2. QuestionType (if BANK_RANDOM) OR Question Picker Button (if BANK_PICKED / BANK_FIXED) */}
                      {isRandom ? (
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Loại câu hỏi
                          </label>
                          <Select
                            value={slot.questionType || 'ALL'}
                            onValueChange={(val) =>
                              handleUpdateSlot(secIdx, slotIdx, {
                                questionType: val === 'ALL' ? null : (val as QuestionType),
                              })
                            }
                          >
                            <SelectTrigger className="h-9 bg-white text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Tất cả loại câu</SelectItem>
                              <SelectItem value={QuestionType.LY_THUYET}>Lý thuyết</SelectItem>
                              <SelectItem value={QuestionType.THUC_HANH}>Thực hành</SelectItem>
                              <SelectItem value={QuestionType.TU_LUAN}>Tự luận</SelectItem>
                              <SelectItem value={QuestionType.TINH_HUONG}>Tình huống</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            {isFixed
                              ? 'Câu hỏi cố định (mọi đề đều có câu này)'
                              : 'Nhóm câu hỏi chỉ định (bốc ngẫu nhiên từ nhóm này)'}
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-full text-xs bg-white justify-between"
                            onClick={() => openQuestionPicker(secIdx, slotIdx)}
                          >
                            <span>
                              {pickedCount > 0
                                ? `Đã chọn ${pickedCount} câu hỏi từ ngân hàng`
                                : 'Bấm để chọn câu hỏi từ ngân hàng...'}
                            </span>
                            <Search className="h-3.5 w-3.5 ml-2 text-primary" />
                          </Button>
                        </div>
                      )}

                      {/* 3. Question count */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                          Số câu sinh ra / đề
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          disabled={isFixed}
                          value={slot.questionCount}
                          onChange={(e) =>
                            handleUpdateSlot(secIdx, slotIdx, {
                              questionCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="h-9 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Add Section Button & Live Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Button type="button" variant="outline" onClick={handleAddSection}>
          <Plus className="h-4 w-4 mr-1.5" /> Thêm Phần thi (Section) mới
        </Button>

        <div className="flex flex-wrap items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-md border text-xs">
          <Layers className="h-4 w-4 text-primary" />
          <span>
            Tổng số phần: <strong>{sections.length} phần</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span>
            Tổng số câu / đề: <strong>{totalQuestions} câu (Câu 1 → Câu {totalQuestions})</strong>
          </span>
          <span className="text-slate-400">|</span>
          <Badge variant="secondary" className="text-[11px]">
            Bố cục Word tự động: ~{estimatedPerPage} đề / trang
          </Badge>
        </div>
      </div>

      {/* 4. Question Picker Modal for BANK_PICKED and BANK_FIXED */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Chọn câu hỏi từ Ngân hàng (Đã chọn: {tempSelectedIds.length} câu)
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
            <SearchableSelect
              options={subjectSelectOptions}
              value={pickerSubjectId}
              onChange={setPickerSubjectId}
              placeholder="Lọc theo môn học..."
              searchPlaceholder="Tìm môn học..."
            />

            <Select value={pickerType} onValueChange={setPickerType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Loại câu hỏi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại câu hỏi</SelectItem>
                <SelectItem value={QuestionType.LY_THUYET}>Lý thuyết</SelectItem>
                <SelectItem value={QuestionType.THUC_HANH}>Thực hành</SelectItem>
                <SelectItem value={QuestionType.TU_LUAN}>Tự luận</SelectItem>
                <SelectItem value={QuestionType.TINH_HUONG}>Tình huống</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Tìm nội dung hoặc mã câu hỏi..."
                className="h-9 text-xs pl-8"
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md divide-y max-h-[420px]">
            {pickerLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Đang tải danh sách câu hỏi...
              </div>
            ) : pickerQuestions.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Không tìm thấy câu hỏi nào khớp bộ lọc.
              </div>
            ) : (
              pickerQuestions.map((q) => {
                const checked = tempSelectedIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => togglePickQuestion(q.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      checked ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          {q.code}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {q.type}
                        </Badge>
                        {q.courses && q.courses.length > 0 && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            Đối tượng: {q.courses.map((c) => c.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-800 line-clamp-2">
                        {stripHtml(q.content)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTempSelectedIds([])}
            >
              Bỏ chọn tất cả
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                Hủy
              </Button>
              <Button type="button" onClick={savePickedQuestions}>
                Xác nhận chọn ({tempSelectedIds.length} câu)
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const GraduationBlueprintBuilder = React.memo(GraduationBlueprintBuilderInner);
