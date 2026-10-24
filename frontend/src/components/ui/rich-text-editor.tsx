"use client";

import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung hoặc dán bảng biểu từ Word...',
  height = 320,
  disabled = false,
}) => {
  const editorRef = useRef<any>(null);

  return (
    <div className="w-full border rounded-md overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-primary/20">
      <Editor
        tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js"
        onInit={(_evt: any, editor: any) => (editorRef.current = editor)}
        value={value}
        disabled={disabled}
        onEditorChange={(content: string) => onChange(content)}
        init={{
          height: height,
          menubar: 'table edit insert view format',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
            'searchreplace', 'visualblocks', 'fullscreen', 'table', 'code', 'wordcount'
          ],
          toolbar:
            'undo redo | bold italic underline | ' +
            'alignleft aligncenter alignright alignjustify | bullist numlist | ' +
            'custom_arrow | ' +
            'table tableprops tablerowprops tablecellprops | ' +
            'tableinsertrowbefore tableinsertrowafter tabledeleterow | ' +
            'tableinsertcolbefore tableinsertcolafter tabledeletecol | ' +
            'tablemergecells tablesplitcells | removeformat code fullscreen',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          // Store raw UTF-8 characters instead of named HTML entities (&iacute;, &ecirc;, &shy;)
          entity_encoding: 'raw',
          entities: '160,nbsp,38,amp,60,lt,62,gt',
          extended_valid_elements: '*[*]',
          table_default_attributes: {
            border: '1'
          },
          table_default_styles: {
            'border-collapse': 'collapse',
            'width': '100%'
          },
          // Preprocess pasted content from Word or external sources
          paste_preprocess: (_plugin: any, args: any) => {
            let content = args.content || '';

            // 1. Remove soft hyphens (&shy; or \u00AD) and zero-width spaces which Word often embeds
            content = content.replace(/&shy;/gi, '').replace(/[\u00AD\u200B\uFEFF]/g, '');

            // 2. Decode Word Symbol font arrow characters:
            // In Word Symbol font: 174 (®) = →, 172 (¬) = ←, 171 («) = ↔, 222 (Þ) = ⇒, 219 (Û) = ⇔
            content = content.replace(/<span[^>]*font-family:[^"']*Symbol[^"']*[^>]*>([\s\S]*?)<\/span>/gi, (match: string, inner: string) => {
              let res = inner;
              res = res.replace(/(&reg;|®|&#174;|&#x00ae;)/gi, '→');
              res = res.replace(/(&not;|¬|&#172;|&#x00ac;)/gi, '←');
              res = res.replace(/(&laquo;|«|&#171;|&#x00ab;)/gi, '↔');
              res = res.replace(/(&THORN;|Þ|&#222;|&#x00de;)/gi, '⇒');
              res = res.replace(/(&Ucirc;|Û|&#219;|&#x00db;)/gi, '⇔');
              res = res.replace(/(&macr;|¯|&#175;|&#x00af;)/gi, '↓');
              return res !== inner ? res : match;
            });

            // 3. Decode Word Wingdings font arrow characters:
            content = content.replace(/<span[^>]*font-family:[^"']*Wingdings[^"']*[^>]*>([\s\S]*?)<\/span>/gi, (match: string, inner: string) => {
              let res = inner;
              res = res.replace(/[àèç\u00e0\u00e8\u00e7]/g, '→');
              res = res.replace(/[ßá\u00df\u00e1]/g, '←');
              res = res.replace(/[éê\u00e9\u00ea]/g, '↑');
              res = res.replace(/[ëì\u00eb\u00ec]/g, '↓');
              return res !== inner ? res : match;
            });

            // 4. Handle VML drawing shape arrows if Word copied them as shapes
            content = content.replace(/<v:shape[^>]*arrow[^>]*>[\s\S]*?<\/v:shape>/gi, ' → ');
            content = content.replace(/<v:line[^>]*>[\s\S]*?<\/v:line>/gi, ' → ');

            args.content = content;
          },
          setup: (editor: any) => {
            // Register custom Arrow insertion dropdown button
            editor.ui.registry.addMenuButton('custom_arrow', {
              text: '→ Mũi tên',
              tooltip: 'Chèn ký hiệu mũi tên (→, ⇒, ->, ←, ↔, ⇔, ↑, ↓)',
              fetch: (callback: any) => {
                const items = [
                  {
                    type: 'menuitem',
                    text: '→  Mũi tên phải (đơn)',
                    onAction: () => editor.insertContent('&nbsp;→&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '⇒  Mũi tên suy ra (kép)',
                    onAction: () => editor.insertContent('&nbsp;⇒&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '->  Mũi tên gạch (text)',
                    onAction: () => editor.insertContent('&nbsp;-&gt;&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '←  Mũi tên trái (đơn)',
                    onAction: () => editor.insertContent('&nbsp;←&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '↔  Mũi tên hai chiều',
                    onAction: () => editor.insertContent('&nbsp;↔&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '⇔  Mũi tên tương đương (kép)',
                    onAction: () => editor.insertContent('&nbsp;⇔&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '↑  Mũi tên lên',
                    onAction: () => editor.insertContent('&nbsp;↑&nbsp;')
                  },
                  {
                    type: 'menuitem',
                    text: '↓  Mũi tên xuống',
                    onAction: () => editor.insertContent('&nbsp;↓&nbsp;')
                  }
                ];
                callback(items);
              }
            });

            // Auto-replace typed shortcuts: "-> " to "→ ", "=> " to "⇒ ", "<=> " to "⇔ "
            editor.on('keydown', (e: any) => {
              if (e.key === ' ' || e.keyCode === 32) {
                const rng = editor.selection.getRng();
                if (rng && rng.collapsed && rng.startContainer.nodeType === 3) {
                  const text = rng.startContainer.nodeValue || '';
                  const offset = rng.startOffset;
                  const textBefore = text.substring(0, offset);

                  if (textBefore.endsWith('->')) {
                    e.preventDefault();
                    rng.setStart(rng.startContainer, offset - 2);
                    rng.deleteContents();
                    editor.insertContent('→&nbsp;');
                  } else if (textBefore.endsWith('-->')) {
                    e.preventDefault();
                    rng.setStart(rng.startContainer, offset - 3);
                    rng.deleteContents();
                    editor.insertContent('→&nbsp;');
                  } else if (textBefore.endsWith('=>')) {
                    e.preventDefault();
                    rng.setStart(rng.startContainer, offset - 2);
                    rng.deleteContents();
                    editor.insertContent('⇒&nbsp;');
                  } else if (textBefore.endsWith('<=>')) {
                    e.preventDefault();
                    rng.setStart(rng.startContainer, offset - 3);
                    rng.deleteContents();
                    editor.insertContent('⇔&nbsp;');
                  }
                }
              }
            });
          },
          content_style: `
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 15px; 
              line-height: 1.5; 
              color: #1e293b;
              padding: 10px;
            } 
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-bottom: 10px;
            } 
            table td, table th { 
              border: 1px solid #cbd5e1; 
              padding: 6px 10px; 
              vertical-align: top;
            } 
            table th { 
              background-color: #f8fafc; 
              font-weight: 600; 
            }
            ul, ol {
              padding-left: 24px;
              margin: 6px 0;
            }
            p {
              margin: 4px 0;
            }
          `
        }}
      />
    </div>
  );
};
