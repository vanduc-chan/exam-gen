export interface StructureTreeNode {
  id: string;
  name: string;
  code?: string;
  type: 'root' | 'department' | 'group' | 'subject' | 'khoa' | 'bo_mon' | 'mon_hoc' | string;
  children?: StructureTreeNode[];
}
