package com.example.examgenerator.util;

import org.apache.poi.xwpf.usermodel.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;

import java.math.BigInteger;
import java.util.List;

public class HtmlToWordRenderer {

    /**
     * Checks if a string contains HTML tags.
     */
    public static boolean isHtml(String text) {
        if (text == null || text.trim().isEmpty()) return false;
        String s = text.trim().toLowerCase();
        return (s.contains("<p") || s.contains("<table") || s.contains("<ul") ||
                s.contains("<ol") || s.contains("<div") || s.contains("<br") ||
                s.contains("<h") || s.contains("<b") || s.contains("<strong") ||
                s.contains("<span") || s.contains("<td") || s.contains("<tr") ||
                s.contains("<tbody") || s.contains("<thead")) && s.contains(">");
    }

    /**
     * Render HTML or plain text into an XWPFDocument.
     */
    public static void renderToDocument(XWPFDocument document, String content, String defaultFont, int defaultFontSize) {
        if (content == null || content.trim().isEmpty()) return;

        if (!isHtml(content)) {
            renderPlainText(document, content, defaultFont, defaultFontSize);
            return;
        }

        Document doc = Jsoup.parse(content);
        Element body = doc.body();

        for (Element child : body.children()) {
            renderElement(document, child, defaultFont, defaultFontSize);
        }
    }

    /**
     * Render a question statement into an XWPFDocument with optional tab indent at the start.
     */
    public static void renderQuestionToDocument(XWPFDocument document, String prefix, String content, String defaultFont, int defaultFontSize, boolean withTabIndent) {
        if (content == null) content = "";

        if (!isHtml(content)) {
            XWPFParagraph p = document.createParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(80);
            p.setSpacingAfter(40);

            if (withTabIndent) {
                p.createRun().addTab();
            }

            if (prefix != null && !prefix.isEmpty()) {
                XWPFRun rPrefix = p.createRun();
                rPrefix.setBold(true);
                rPrefix.setFontFamily(defaultFont);
                rPrefix.setFontSize(defaultFontSize);
                rPrefix.setText(prefix);
            }

            XWPFRun rText = p.createRun();
            rText.setFontFamily(defaultFont);
            rText.setFontSize(defaultFontSize);
            rText.setText(normalizeDegreeNotations(content));
            return;
        }

        Document doc = Jsoup.parse(content);
        Element body = doc.body();

        boolean hasBlockChildren = !body.select("p, table, ul, ol, div, h1, h2, h3, h4, h5, h6").isEmpty();
        if (!hasBlockChildren) {
            XWPFParagraph p = document.createParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(80);
            p.setSpacingAfter(40);

            if (withTabIndent) {
                p.createRun().addTab();
            }

            if (prefix != null && !prefix.isEmpty()) {
                XWPFRun rPrefix = p.createRun();
                rPrefix.setBold(true);
                rPrefix.setFontFamily(defaultFont);
                rPrefix.setFontSize(defaultFontSize);
                rPrefix.setText(prefix);
            }

            renderInlineNodes(p, body.childNodes(), defaultFont, defaultFontSize, false, false, false, false, false);
            return;
        }

        boolean isFirst = true;
        for (Element child : body.children()) {
            String tag = child.tagName().toLowerCase();
            if (tag.equals("table")) {
                renderTable(document, child, defaultFont, defaultFontSize);
                isFirst = false;
                continue;
            }
            if (tag.equals("ul") || tag.equals("ol")) {
                renderList(document, child, defaultFont, defaultFontSize);
                isFirst = false;
                continue;
            }

            XWPFParagraph p = document.createParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(isFirst ? 80 : 30);
            p.setSpacingAfter(40);

            String style = child.attr("style").toLowerCase();
            if (style.contains("text-align: center") || child.attr("align").equalsIgnoreCase("center")) {
                p.setAlignment(ParagraphAlignment.CENTER);
            } else if (style.contains("text-align: right") || child.attr("align").equalsIgnoreCase("right")) {
                p.setAlignment(ParagraphAlignment.RIGHT);
            }

            if (isFirst) {
                if (withTabIndent) {
                    p.createRun().addTab();
                }
                if (prefix != null && !prefix.isEmpty()) {
                    XWPFRun rPrefix = p.createRun();
                    rPrefix.setBold(true);
                    rPrefix.setFontFamily(defaultFont);
                    rPrefix.setFontSize(defaultFontSize);
                    rPrefix.setText(prefix);
                }
            }

            boolean isHeading = child.tagName().startsWith("h");
            renderInlineNodes(p, child.childNodes(), defaultFont, isHeading ? defaultFontSize + 1 : defaultFontSize, isHeading, false, false, false, false);
            isFirst = false;
        }
    }

    /**
     * Fallback renderer for plain text with subsections and bullets.
     */
    private static void renderPlainText(XWPFDocument document, String text, String defaultFont, int defaultFontSize) {
        String[] lines = text.split("\\r?\\n");
        boolean hasActiveSubhead = false;

        for (int lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            String rawLine = lines[lineIdx];
            if (rawLine.trim().isEmpty()) continue;

            String lineStr = normalizeDegreeNotations(rawLine.trim());
            XWPFParagraph linePara = document.createParagraph();
            linePara.setAlignment(ParagraphAlignment.BOTH);
            linePara.setSpacingAfter(40);

            XWPFRun lineRun = linePara.createRun();
            lineRun.setFontFamily(defaultFont);
            lineRun.setFontSize(defaultFontSize);

            boolean isSubhead = lineStr.matches("^(?i)[a-z0-9]+\\s*(\\)|\\.).*");
            boolean isBullet = lineStr.startsWith("-") || lineStr.startsWith("+") || lineStr.startsWith("*") || lineStr.startsWith("•");

            if (isSubhead) {
                hasActiveSubhead = true;
                linePara.setIndentationLeft(360);
                lineRun.setText(lineStr);
            } else if (isBullet) {
                int leftIndent = hasActiveSubhead ? 720 : 540;
                linePara.setIndentationLeft(leftIndent);
                lineRun.setText(lineStr);
            } else {
                boolean isTitle = (lineIdx == 0) || !hasActiveSubhead;
                if (isTitle) {
                    lineRun.setBold(true);
                    linePara.setIndentationLeft(180);
                } else {
                    linePara.setIndentationLeft(360);
                }
                lineRun.setText(lineStr);
            }
        }
    }

    /**
     * Render a top-level HTML element to the XWPFDocument.
     */
    private static void renderElement(XWPFDocument document, Element element, String defaultFont, int defaultFontSize) {
        String tag = element.tagName().toLowerCase();

        switch (tag) {
            case "table":
                renderTable(document, element, defaultFont, defaultFontSize);
                break;
            case "ul":
            case "ol":
                renderList(document, element, defaultFont, defaultFontSize);
                break;
            case "p":
            case "div":
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                renderParagraph(document, element, defaultFont, defaultFontSize);
                break;
            default:
                // If it has children tables or divs, recurse, otherwise render as paragraph
                if (!element.select("table, p, ul, ol, div").isEmpty()) {
                    for (Element child : element.children()) {
                        renderElement(document, child, defaultFont, defaultFontSize);
                    }
                } else {
                    renderParagraph(document, element, defaultFont, defaultFontSize);
                }
                break;
        }
    }

    /**
     * Render an HTML paragraph or heading.
     */
    private static void renderParagraph(XWPFDocument document, Element element, String defaultFont, int defaultFontSize) {
        XWPFParagraph p = document.createParagraph();
        p.setAlignment(ParagraphAlignment.BOTH);
        p.setSpacingBefore(40);
        p.setSpacingAfter(40);

        String style = element.attr("style").toLowerCase();
        if (style.contains("text-align: center") || element.attr("align").equalsIgnoreCase("center")) {
            p.setAlignment(ParagraphAlignment.CENTER);
        } else if (style.contains("text-align: right") || element.attr("align").equalsIgnoreCase("right")) {
            p.setAlignment(ParagraphAlignment.RIGHT);
        }

        boolean isHeading = element.tagName().startsWith("h");
        renderInlineNodes(p, element.childNodes(), defaultFont, isHeading ? defaultFontSize + 1 : defaultFontSize, isHeading, false, false, false, false);
    }

    /**
     * Render an HTML list (<ul> or <ol>).
     */
    private static void renderList(XWPFDocument document, Element listElement, String defaultFont, int defaultFontSize) {
        boolean isOrdered = listElement.tagName().equalsIgnoreCase("ol");
        Elements items = listElement.children();

        int itemIndex = 1;
        for (Element li : items) {
            if (!li.tagName().equalsIgnoreCase("li")) continue;

            XWPFParagraph p = document.createParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setIndentationLeft(540);
            p.setSpacingBefore(20);
            p.setSpacingAfter(30);

            XWPFRun bulletRun = p.createRun();
            bulletRun.setFontFamily(defaultFont);
            bulletRun.setFontSize(defaultFontSize);
            bulletRun.setText(isOrdered ? (itemIndex + ". ") : "• ");

            renderInlineNodes(p, li.childNodes(), defaultFont, defaultFontSize, false, false, false, false, false);
            itemIndex++;
        }
    }

    /**
     * Render an HTML Table with borders, cell padding, colspan, and rowspan.
     */
    private static void renderTable(XWPFDocument document, Element tableElement, String defaultFont, int defaultFontSize) {
        Elements trs = tableElement.select("tr");
        if (trs.isEmpty()) return;

        // Calculate maximum columns in the grid
        int maxCols = 0;
        for (Element tr : trs) {
            int rowCols = 0;
            for (Element cell : tr.children()) {
                if (cell.tagName().equalsIgnoreCase("td") || cell.tagName().equalsIgnoreCase("th")) {
                    int colspan = 1;
                    if (cell.hasAttr("colspan")) {
                        try { colspan = Integer.parseInt(cell.attr("colspan")); } catch (Exception ignored) {}
                    }
                    rowCols += Math.max(1, colspan);
                }
            }
            maxCols = Math.max(maxCols, rowCols);
        }
        if (maxCols == 0) maxCols = 1;

        int numRows = trs.size();
        XWPFTable table = document.createTable(numRows, maxCols);
        table.setWidth("100%");
        table.setTableAlignment(TableRowAlign.CENTER);

        CTTblGrid tblGrid = table.getCTTbl().getTblGrid() != null ? table.getCTTbl().getTblGrid() : table.getCTTbl().addNewTblGrid();
        int baseColWidth = 10772 / maxCols;
        for (int cIdx = 0; cIdx < maxCols; cIdx++) {
            tblGrid.addNewGridCol().setW(BigInteger.valueOf(baseColWidth));
        }

        // Keep track of active row spans: column index -> remaining rows to span
        int[] activeRowSpans = new int[maxCols];

        for (int r = 0; r < numRows; r++) {
            Element tr = trs.get(r);
            XWPFTableRow row = table.getRow(r);
            row.setCantSplitRow(true);

            int colIdx = 0;
            Elements cellElements = tr.children();
            int cellElemIdx = 0;

            while (colIdx < maxCols) {
                // If this column is covered by a vertical merge from an earlier row
                if (activeRowSpans[colIdx] > 0) {
                    XWPFTableCell mergedCell = row.getCell(colIdx);
                    if (mergedCell != null) {
                        setCellVMerge(mergedCell, false); // continue merge
                        applyStandardCellBorders(mergedCell);
                        setCellPadding(mergedCell, 100, 100, 150, 150);
                    }
                    activeRowSpans[colIdx]--;
                    colIdx++;
                    continue;
                }

                if (cellElemIdx >= cellElements.size()) {
                    break;
                }

                Element cellElem = cellElements.get(cellElemIdx++);
                if (!cellElem.tagName().equalsIgnoreCase("td") && !cellElem.tagName().equalsIgnoreCase("th")) {
                    continue;
                }

                boolean isHeader = cellElem.tagName().equalsIgnoreCase("th");
                int colspan = 1;
                int rowspan = 1;

                if (cellElem.hasAttr("colspan")) {
                    try { colspan = Integer.parseInt(cellElem.attr("colspan")); } catch (Exception ignored) {}
                }
                if (cellElem.hasAttr("rowspan")) {
                    try { rowspan = Integer.parseInt(cellElem.attr("rowspan")); } catch (Exception ignored) {}
                }
                colspan = Math.max(1, colspan);
                rowspan = Math.max(1, rowspan);

                XWPFTableCell cell = row.getCell(colIdx);
                if (cell == null) {
                    cell = row.createCell();
                }

                // Apply horizontal merge (colspan)
                if (colspan > 1) {
                    setCellColSpan(cell, colspan);
                }

                // Apply vertical merge (rowspan)
                if (rowspan > 1) {
                    setCellVMerge(cell, true); // restart merge
                    for (int c = 0; c < colspan; c++) {
                        if (colIdx + c < maxCols) {
                            activeRowSpans[colIdx + c] = rowspan - 1;
                        }
                    }
                }

                // Cell styling
                applyStandardCellBorders(cell);
                setCellPadding(cell, 100, 100, 150, 150);

                if (isHeader) {
                    cell.setColor("F1F5F9");
                }

                // Render cell text content
                XWPFParagraph cellPara = cell.getParagraphArray(0);
                if (cellPara == null) cellPara = cell.addParagraph();
                cellPara.setSpacingBefore(30);
                cellPara.setSpacingAfter(30);

                String align = cellElem.attr("align").toLowerCase();
                String style = cellElem.attr("style").toLowerCase();
                if (align.contains("center") || style.contains("text-align: center") || isHeader) {
                    cellPara.setAlignment(ParagraphAlignment.CENTER);
                } else if (align.contains("right") || style.contains("text-align: right")) {
                    cellPara.setAlignment(ParagraphAlignment.RIGHT);
                } else {
                    cellPara.setAlignment(ParagraphAlignment.BOTH);
                }

                renderInlineNodes(cellPara, cellElem.childNodes(), defaultFont, defaultFontSize - 1, isHeader, false, false, false, false);

                colIdx += colspan;
            }
        }

        // Add a clean spacer after the table
        XWPFParagraph afterTable = document.createParagraph();
        afterTable.setSpacingBefore(60);
        afterTable.setSpacingAfter(40);
    }

    /**
     * Normalizes non-tech user notations for degree (e.g. 37oC -> 37°C, 90o -> 90°, 90^o -> 90°).
     */
    public static String normalizeDegreeNotations(String text) {
        if (text == null || text.isEmpty()) return text;
        // 1. Temperature: e.g. "37oC" or "100 oC" -> "37°C"
        String res = text.replaceAll("(?<=\\d)\\s*[oO]C\\b", "°C");
        // 2. Exponential degree: e.g. "90^o", "90^0" -> "90°"
        res = res.replaceAll("(?<=\\d)\\s*\\^[oO0]", "°");
        // 3. Angles / coordinates: e.g. 0o, 45o, 90o, 180o, 360o
        res = res.replaceAll("(?<=\\b(?:[0-9]|[1-9][0-9]|1[0-7][0-9]|180|360))[oO](?=[\\s,;\\.\\?\\)]|$)", "°");
        return res;
    }

    /**
     * Recursively renders inline HTML nodes into runs of an XWPFParagraph.
     */
    private static void renderInlineNodes(XWPFParagraph p, List<Node> nodes, String font, int fontSize, boolean bold, boolean italic, boolean underline, boolean superscript, boolean subscript) {
        for (Node node : nodes) {
            if (node instanceof TextNode) {
                String text = ((TextNode) node).text().replace("\u00AD", "").replace("\u200B", "").replace("\uFEFF", "");
                text = normalizeDegreeNotations(text);
                if (!text.isEmpty()) {
                    XWPFRun run = p.createRun();
                    run.setFontFamily(font);
                    run.setFontSize(fontSize);
                    run.setText(text);
                    if (bold) run.setBold(true);
                    if (italic) run.setItalic(true);
                    if (underline) run.setUnderline(UnderlinePatterns.SINGLE);
                    if (superscript) {
                        run.setSubscript(VerticalAlign.SUPERSCRIPT);
                    } else if (subscript) {
                        run.setSubscript(VerticalAlign.SUBSCRIPT);
                    }
                }
            } else if (node instanceof Element) {
                Element el = (Element) node;
                String tag = el.tagName().toLowerCase();

                if (tag.equals("br")) {
                    XWPFRun brRun = p.createRun();
                    brRun.addBreak();
                    continue;
                }

                boolean nextBold = bold || tag.equals("strong") || tag.equals("b");
                boolean nextItalic = italic || tag.equals("em") || tag.equals("i");
                boolean nextUnderline = underline || tag.equals("u");
                boolean nextSup = superscript || tag.equals("sup");
                boolean nextSub = subscript || tag.equals("sub");

                renderInlineNodes(p, el.childNodes(), font, fontSize, nextBold, nextItalic, nextUnderline, nextSup, nextSub);
            }
        }
    }

    private static void setCellColSpan(XWPFTableCell cell, int colspan) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTDecimalNumber gridSpan = tcPr.isSetGridSpan() ? tcPr.getGridSpan() : tcPr.addNewGridSpan();
        gridSpan.setVal(BigInteger.valueOf(colspan));
    }

    private static void setCellVMerge(XWPFTableCell cell, boolean isRestart) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTVMerge vMerge = tcPr.isSetVMerge() ? tcPr.getVMerge() : tcPr.addNewVMerge();
        if (isRestart) {
            vMerge.setVal(STMerge.RESTART);
        } else {
            vMerge.setVal(STMerge.CONTINUE);
        }
    }

    private static void applyStandardCellBorders(XWPFTableCell cell) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTTcBorders borders = tcPr.isSetTcBorders() ? tcPr.getTcBorders() : tcPr.addNewTcBorders();

        CTBorder borderTop = borders.isSetTop() ? borders.getTop() : borders.addNewTop();
        borderTop.setVal(STBorder.SINGLE);
        borderTop.setSz(BigInteger.valueOf(4)); // 0.5 pt
        borderTop.setColor("D0D5DD");

        CTBorder borderBottom = borders.isSetBottom() ? borders.getBottom() : borders.addNewBottom();
        borderBottom.setVal(STBorder.SINGLE);
        borderBottom.setSz(BigInteger.valueOf(4));
        borderBottom.setColor("D0D5DD");

        CTBorder borderLeft = borders.isSetLeft() ? borders.getLeft() : borders.addNewLeft();
        borderLeft.setVal(STBorder.SINGLE);
        borderLeft.setSz(BigInteger.valueOf(4));
        borderLeft.setColor("D0D5DD");

        CTBorder borderRight = borders.isSetRight() ? borders.getRight() : borders.addNewRight();
        borderRight.setVal(STBorder.SINGLE);
        borderRight.setSz(BigInteger.valueOf(4));
        borderRight.setColor("D0D5DD");
    }

    private static void setCellPadding(XWPFTableCell cell, int top, int bottom, int left, int right) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTTcMar tcMar = tcPr.isSetTcMar() ? tcPr.getTcMar() : tcPr.addNewTcMar();

        CTTblWidth wTop = tcMar.isSetTop() ? tcMar.getTop() : tcMar.addNewTop();
        wTop.setType(STTblWidth.DXA);
        wTop.setW(BigInteger.valueOf(top));

        CTTblWidth wBottom = tcMar.isSetBottom() ? tcMar.getBottom() : tcMar.addNewBottom();
        wBottom.setType(STTblWidth.DXA);
        wBottom.setW(BigInteger.valueOf(bottom));

        CTTblWidth wLeft = tcMar.isSetLeft() ? tcMar.getLeft() : tcMar.addNewLeft();
        wLeft.setType(STTblWidth.DXA);
        wLeft.setW(BigInteger.valueOf(left));

        CTTblWidth wRight = tcMar.isSetRight() ? tcMar.getRight() : tcMar.addNewRight();
        wRight.setType(STTblWidth.DXA);
        wRight.setW(BigInteger.valueOf(right));
    }

    /**
     * Strips HTML tags and returns clean plain text.
     */
    public static String stripHtml(String html) {
        if (html == null) return "";
        String cleaned = html.replace("&shy;", "").replace("\u00AD", "").replace("\u200B", "").replace("\uFEFF", "");
        return Jsoup.parse(cleaned).text();
    }

    /**
     * Render HTML or plain text into an XWPFTableCell (for exam boxes).
     */
    public static void renderToCell(XWPFTableCell cell, String prefix, String content, String defaultFont, int defaultFontSize) {
        if (content == null || content.trim().isEmpty()) return;

        if (!isHtml(content)) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(0);
            p.setSpacingAfter(30);
            XWPFRun r = p.createRun();
            r.setBold(true);
            r.setFontFamily(defaultFont);
            r.setFontSize(defaultFontSize);
            r.setText(prefix + normalizeDegreeNotations(content));
            return;
        }

        Document doc = Jsoup.parse(content);
        Element body = doc.body();
        boolean isFirst = true;

        Elements children = body.children();
        if (children.isEmpty()) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(0);
            p.setSpacingAfter(30);

            if (prefix != null && !prefix.isEmpty()) {
                XWPFRun rPrefix = p.createRun();
                rPrefix.setBold(true);
                rPrefix.setFontFamily(defaultFont);
                rPrefix.setFontSize(defaultFontSize);
                rPrefix.setText(prefix);
            }
            renderInlineNodes(p, body.childNodes(), defaultFont, defaultFontSize, false, false, false, false, false);
            return;
        }

        for (Element child : children) {
            XWPFParagraph p = cell.addParagraph();
            p.setAlignment(ParagraphAlignment.BOTH);
            p.setSpacingBefore(0);
            p.setSpacingAfter(30);

            if (isFirst && prefix != null && !prefix.isEmpty()) {
                XWPFRun rPrefix = p.createRun();
                rPrefix.setBold(true);
                rPrefix.setFontFamily(defaultFont);
                rPrefix.setFontSize(defaultFontSize);
                rPrefix.setText(prefix);
            }
            renderInlineNodes(p, child.childNodes(), defaultFont, defaultFontSize, false, false, false, false, false);
            isFirst = false;
        }
    }
}

