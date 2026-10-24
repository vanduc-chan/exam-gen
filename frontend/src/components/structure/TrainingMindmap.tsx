"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { StructureTreeNode } from '@/types/structureTree';
import { Button } from '@/components/ui/button';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react';

interface TrainingMindmapProps {
  data: StructureTreeNode;
  className?: string;
  height?: number | string;
}

export const TrainingMindmap: React.FC<TrainingMindmapProps> = ({
  data,
  className = '',
  height = 'calc(100vh - 220px)',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Store references for toolbar controls
  const controlsRef = useRef<{
    centerRoot: () => void;
    expandAll: () => void;
    collapseAll: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  }>({
    centerRoot: () => {},
    expandAll: () => {},
    collapseAll: () => {},
    zoomIn: () => {},
    zoomOut: () => {},
  });

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !data) return;

    const container = containerRef.current;
    const svgElement = svgRef.current;
    const width = container.clientWidth || 1000;
    const currentHeight = container.clientHeight || 700;

    // Clear any previous SVG contents
    d3.select(svgElement).selectAll('*').remove();

    const rectW = 220;
    const rectH = 50;
    const nodeSeparationX = 300;
    const nodeSeparationY = 70;

    const svg = d3.select<SVGSVGElement, unknown>(svgElement)
      .attr('width', width)
      .attr('height', currentHeight)
      .style('user-select', 'none');

    // Drop Shadow filter definition
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '150%')
      .attr('height', '150%');

    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '3')
      .attr('stdDeviation', '4')
      .attr('flood-color', '#0f172a')
      .attr('flood-opacity', '0.08');

    const g = svg.append('g').attr('class', 'mindmap-root-group');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Tree layout
    const treeMap = d3.tree<StructureTreeNode>()
      .nodeSize([nodeSeparationY, nodeSeparationX]);

    const root: any = d3.hierarchy<StructureTreeNode>(data, (d) => d.children);
    root.x0 = 0;
    root.y0 = 0;

    // Color configuration by level
    const colorConfig: Record<number, { bg: string; border: string; text: string; badgeBg: string; badgeText: string; typeLabel: string }> = {
      0: { bg: '#eef2ff', border: '#6366f1', text: '#312e81', badgeBg: '#4f46e5', badgeText: '#ffffff', typeLabel: 'ĐƠN VỊ' },
      1: { bg: '#f0fdf4', border: '#22c55e', text: '#14532d', badgeBg: '#16a34a', badgeText: '#ffffff', typeLabel: 'KHOA' },
      2: { bg: '#fffbeb', border: '#f59e0b', text: '#78350f', badgeBg: '#d97706', badgeText: '#ffffff', typeLabel: 'TỔ BỘ MÔN' },
      3: { bg: '#fdf2f8', border: '#ec4899', text: '#831843', badgeBg: '#db2777', badgeText: '#ffffff', typeLabel: 'MÔN HỌC' },
    };

    // Initially collapse children from depth >= 2
    function collapseDeep(d: any) {
      if (d.children) {
        d.children.forEach((c: any) => collapseDeep(c));
        if (d.depth >= 2) {
          d._children = d.children;
          d.children = null;
        }
      }
    }
    if (root.children) {
      root.children.forEach((c: any) => collapseDeep(c));
    }

    let nodeIndex = 0;
    const duration = 500;

    function diagonalPath(s: { x: number; y: number }, d: { x: number; y: number }) {
      const sourceX = s.y + rectW;
      const sourceY = s.x;
      const targetX = d.y;
      const targetY = d.x;
      const midX = (sourceX + targetX) / 2;

      return `M ${sourceX} ${sourceY}
              C ${midX} ${sourceY},
                ${midX} ${targetY},
                ${targetX} ${targetY}`;
    }

    function truncateText(str: string, maxLength: number) {
      if (!str) return '';
      return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    function update(source: any) {
      const treeData = treeMap(root);
      const nodes: any[] = treeData.descendants();
      const links = treeData.links();

      nodes.forEach((d: any) => {
        d.y = d.depth * nodeSeparationX;
      });

      // --- NODES ---
      const node = g.selectAll<SVGGElement, any>('g.node')
        .data(nodes, (d: any) => d.id || (d.id = ++nodeIndex));

      const nodeEnter = node.enter().append('g')
        .attr('class', (d: any) => `node cursor-pointer ${d._children ? 'node-collapsed' : ''}`)
        .attr('transform', () => `translate(${source.y0 ?? 0},${source.x0 ?? 0})`)
        .on('click', (_event, d: any) => {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else if (d._children) {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        });

      // Node card rect
      nodeEnter.append('rect')
        .attr('width', rectW)
        .attr('height', rectH)
        .attr('y', -rectH / 2)
        .attr('rx', 8)
        .attr('ry', 8)
        .style('fill', (d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].bg : '#ffffff'))
        .style('stroke', (d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].border : '#cccccc'))
        .style('stroke-width', '1.5px')
        .style('filter', 'url(#drop-shadow)')
        .style('transition', 'all 0.2s ease');

      // Small type badge pill on top left
      const badgeG = nodeEnter.append('g')
        .attr('transform', `translate(8, ${-rectH / 2 + 5})`);

      badgeG.append('rect')
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('height', 14)
        .attr('width', (d: any) => {
          const cfg = colorConfig[d.depth] || colorConfig[3];
          return (cfg.typeLabel.length * 6.5) + 8;
        })
        .style('fill', (d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].badgeBg : '#475569'));

      badgeG.append('text')
        .attr('x', 4)
        .attr('y', 10.5)
        .style('font-size', '9px')
        .style('font-weight', '700')
        .style('fill', '#ffffff')
        .text((d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].typeLabel : 'MỤC'));

      // Code tag (if exists)
      nodeEnter.append('text')
        .attr('x', rectW - 8)
        .attr('y', -rectH / 2 + 15)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', (d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].text : '#64748b'))
        .text((d: any) => (d.data.code ? `[${d.data.code}]` : ''));

      // Main title text
      nodeEnter.append('text')
        .attr('x', 10)
        .attr('y', 8)
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', (d: any) => (colorConfig[d.depth] ? colorConfig[d.depth].text : '#1e293b'))
        .text((d: any) => truncateText(d.data.name, 24))
        .append('title')
        .text((d: any) => `${d.data.name} ${d.data.code ? `(${d.data.code})` : ''}`);

      // Sub-label for child count if has collapsed children
      nodeEnter.append('text')
        .attr('class', 'child-count-indicator')
        .attr('x', rectW - 8)
        .attr('y', rectH / 2 - 8)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('font-weight', '500')
        .style('fill', '#64748b');

      // Update Phase
      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(duration)
        .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

      // Dashed border when collapsed
      nodeUpdate.select('rect')
        .style('stroke-dasharray', (d: any) => (d._children ? '4 3' : '0'))
        .style('stroke-width', (d: any) => (d._children ? '2px' : '1.5px'));

      // Update child count text
      nodeUpdate.select('.child-count-indicator')
        .text((d: any) => {
          if (d._children && d._children.length > 0) {
            return `+${d._children.length} mục`;
          }
          return '';
        });

      // Exit Phase
      node.exit().transition()
        .duration(duration)
        .attr('transform', () => `translate(${source.y},${source.x})`)
        .remove();

      // --- LINKS ---
      const link = g.selectAll<SVGPathElement, any>('path.link')
        .data(links, (d: any) => d.target.id);

      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', '2px')
        .attr('d', () => {
          const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
          return diagonalPath(o, o);
        });

      const linkUpdate = linkEnter.merge(link);
      linkUpdate.transition()
        .duration(duration)
        .attr('d', (d: any) => diagonalPath(d.source, d.target));

      link.exit().transition()
        .duration(duration)
        .attr('d', () => {
          const o = { x: source.x, y: source.y };
          return diagonalPath(o, o);
        })
        .remove();

      // Stash the old positions for transition
      nodes.forEach((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function centerRoot() {
      const scale = 0.85;
      const tx = width / 6;
      const ty = currentHeight / 2;

      (svg.transition() as any)
        .duration(700)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    function expandRecursive(d: any) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) {
        d.children.forEach((c: any) => expandRecursive(c));
      }
    }

    function collapseRecursive(d: any) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach((c: any) => collapseRecursive(c));
      }
    }

    function expandAll() {
      expandRecursive(root);
      update(root);
    }

    function collapseAll() {
      if (root.children) {
        root.children.forEach((c: any) => collapseRecursive(c));
      }
      update(root);
      centerRoot();
    }

    function zoomIn() {
      (svg.transition() as any).duration(300).call(zoom.scaleBy, 1.3);
    }

    function zoomOut() {
      (svg.transition() as any).duration(300).call(zoom.scaleBy, 0.7);
    }

    // Assign controls
    controlsRef.current = {
      centerRoot,
      expandAll,
      collapseAll,
      zoomIn,
      zoomOut,
    };

    // Initial render
    update(root);
    centerRoot();

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current || !svgRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      d3.select(svgRef.current).attr('width', newW).attr('height', newH);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`relative w-full rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-[10000] w-screen h-screen bg-slate-50 rounded-none'
          : className
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Legend & Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-slate-200 z-10 shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">Chú thích phân cấp:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span>
            <span className="text-slate-600">Trường</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Khoa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span className="text-slate-600">Tổ bộ môn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 inline-block"></span>
            <span className="text-slate-600">Môn học</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 mr-1" /> : <Maximize2 className="h-3.5 w-3.5 mr-1" />}
            {isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          </Button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Floating Toolbar matching b_n_t_duy_i_h_c.html */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 p-1.5 rounded-lg shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => controlsRef.current.centerRoot()}
            className="h-8 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Căn giữa bản đồ"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Căn giữa
          </Button>
          <div className="h-4 w-px bg-slate-200"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => controlsRef.current.expandAll()}
            className="h-8 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Mở rộng tất cả các nhánh"
          >
            <ChevronsRight className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Mở rộng tất cả
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => controlsRef.current.collapseAll()}
            className="h-8 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Thu gọn về ban đầu"
          >
            <ChevronsLeft className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
            Thu gọn tất cả
          </Button>
          <div className="h-4 w-px bg-slate-200"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => controlsRef.current.zoomIn()}
            className="h-8 w-8 text-slate-700 hover:bg-slate-100"
            title="Phóng to"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => controlsRef.current.zoomOut()}
            className="h-8 w-8 text-slate-700 hover:bg-slate-100"
            title="Thu nhỏ"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
