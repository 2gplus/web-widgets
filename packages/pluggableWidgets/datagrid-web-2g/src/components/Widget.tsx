import { Pagination } from "@mendix/widget-plugin-grid/components/Pagination";
import { SelectionStatus } from "@mendix/widget-plugin-grid/selection";
import { GridSelectionProps } from "@mendix/widget-plugin-grid/selection/useGridSelectionProps";
import { Big } from "big.js";
import classNames from "classnames";
import { DynamicValue, ObjectItem } from "mendix";
import { CSSProperties, ReactElement, ReactNode, createElement, useCallback, useMemo, useState } from "react";
import { DataObjectsType, PagingPositionEnum } from "../../typings/DatagridProps";
import { WidgetPropsProvider } from "../helpers/useWidgetProps";
import { CellComponent } from "../typings/CellComponent";
import { ColumnId, GridColumn } from "../typings/GridColumn";
import { CheckboxColumnHeader } from "./CheckboxColumnHeader";
import { ColumnResizer } from "./ColumnResizer";
import { ColumnSelector } from "./ColumnSelector";
import { Grid } from "./Grid";
import { GridBody } from "./GridBody";
import { Header } from "./Header";
import { Row } from "./Row";
import { WidgetContent } from "./WidgetContent";
import { WidgetFooter } from "./WidgetFooter";
import { WidgetHeader } from "./WidgetHeader";
import { WidgetRoot } from "./WidgetRoot";
import { WidgetTopBar } from "./WidgetTopBar";
import { ExportWidget } from "./ExportWidget";
import { KeyNavProvider } from "../features/keyboard-navigation/context";
import * as GridModel from "../typings/GridModel";

export interface WidgetProps<C extends GridColumn, T extends ObjectItem = ObjectItem> {
    CellComponent: CellComponent<C>;
    className: string;
    columnsDraggable: boolean;
    columnsFilterable: boolean;
    columnsHidable: boolean;
    columnsResizable: boolean;
    columnsSortable: boolean;
    data: T[];
    emptyPlaceholderRenderer?: (renderWrapper: (children: ReactNode) => ReactElement) => ReactElement;
    exporting: boolean;
    filterRenderer: (renderWrapper: (children: ReactNode) => ReactElement, columnIndex: number) => ReactElement;
    hasMoreItems: boolean;
    headerContent?: ReactNode;
    headerTitle?: string;
    headerWrapperRenderer: (columnIndex: number, header: ReactElement) => ReactElement;
    id: string;
    numberOfItems?: number;
    onExportCancel?: () => void;
    page: number;
    pageSize: number;
    paging: boolean;
    pagingPosition: PagingPositionEnum;
    preview?: boolean;
    processedRows: number;
    rowClass?: (item: T) => string;
    setPage?: (computePage: (prevPage: number) => number) => void;
    styles?: CSSProperties;
    valueForSort: (value: T, columnIndex: number) => string | Big | boolean | Date | undefined;
    rowAction?: (e: any, isDoubleClick: boolean, value: ObjectItem) => void;
    selectionProps: GridSelectionProps;
    selectionStatus: SelectionStatus;
    showSelectAllToggle?: boolean;
    state: GridModel.State;
    actions: GridModel.Actions;
    exportDialogLabel?: string;
    cancelExportLabel?: string;
    selectRowLabel?: string;

    /**
     * Custom 2G props
     */
    rowOnClickHandler?: (e: any, isDoubleClick: boolean, value: ObjectItem) => void;
    dataAttributes?: DataObjectsType[];
    headerText?: DynamicValue<string>;
    filtersAboveTable: boolean;
}

export interface SortingRule {
    id: string;
    desc: boolean;
}

export function Widget<C extends GridColumn>(props: WidgetProps<C>): ReactElement {
    const {
        className,
        columnsDraggable,
        columnsFilterable,
        columnsHidable,
        columnsResizable,
        columnsSortable,
        data: rows,
        emptyPlaceholderRenderer,
        exporting,
        filterRenderer: filterRendererProp,
        headerContent,
        headerTitle,
        hasMoreItems,
        headerWrapperRenderer,
        id,
        numberOfItems,
        onExportCancel,
        page,
        pageSize,
        paging,
        pagingPosition,
        preview,
        processedRows,
        setPage,
        styles,
        selectionProps,
        CellComponent,
        state,
        actions
    } = props;
    const columnsToShow = preview ? state.allColumns : state.visibleColumns;
    const extraColumnsCount = (columnsHidable ? 1 : 0) + (props.selectionProps.showCheckboxColumn ? 1 : 0);
    const keyboardNavColumnsCount = columnsToShow.length + (props.selectionProps.showCheckboxColumn ? 1 : 0);
    const columnsVisibleCount = columnsToShow.length + extraColumnsCount;

    const isInfinite = !paging;
    const [isDragging, setIsDragging] = useState(false);
    const [dragOver, setDragOver] = useState<ColumnId | undefined>(undefined);
    const showHeader = !!headerContent;
    const hasHeaderText =
        props.headerText !== undefined &&
        props.headerText.status === "available" &&
        props.headerText.value.trim().length > 0;
    const showTopBar =
        hasHeaderText || showHeader || (paging && (pagingPosition === "top" || pagingPosition === "both"));

    const renderFilterWrapper = useCallback(
        (children: ReactNode) => (
            <div className="filter" style={{ pointerEvents: isDragging ? "none" : undefined }}>
                {children}
            </div>
        ),
        [isDragging]
    );

    const pagination = paging ? (
        <Pagination
            canNextPage={hasMoreItems}
            canPreviousPage={page !== 0}
            gotoPage={(page: number) => setPage && setPage(() => page)}
            nextPage={() => setPage && setPage(prev => prev + 1)}
            numberOfItems={numberOfItems}
            page={page}
            pageSize={pageSize}
            previousPage={() => setPage && setPage(prev => prev - 1)}
            pagination={"buttons"}
        />
    ) : null;
    const cssGridStyles = useMemo(
        () =>
            gridStyle(columnsToShow, props.state.size, {
                selectItemColumn: selectionProps.showCheckboxColumn,
                visibilitySelectorColumn: columnsHidable
            }),
        [props.state.size, columnsToShow, columnsHidable, selectionProps.showCheckboxColumn]
    );
    const selectionEnabled = props.selectionProps.selectionType !== "None";
    const useHeaderFilters = props.filtersAboveTable;
    return (
        <WidgetPropsProvider value={props}>
            <WidgetRoot
                className={className}
                selectionMethod={selectionProps.selectionMethod}
                selection={selectionEnabled}
                style={styles}
                exporting={exporting}
            >
                {useHeaderFilters ? (
                    <div className={"header-filters"}>
                        {state.allColumns.map(column => filterRendererProp(renderFilterWrapper, column.columnNumber))}
                    </div>
                ) : null}
                {showTopBar && (
                    <WidgetTopBar>
                        {hasHeaderText ? (
                            <div className={"table-label"}>
                                <h4>{props.headerText?.value}</h4>
                            </div>
                        ) : null}
                        {showHeader && (
                            <WidgetHeader
                                className={hasHeaderText ? "widgets-align-right" : ""}
                                headerTitle={headerTitle}
                            >
                                {headerContent}
                            </WidgetHeader>
                        )}
                        {paging && (pagingPosition === "top" || pagingPosition === "both") ? pagination : null}
                        {hasHeaderText ? <hr className={"table-header-line"} /> : null}
                    </WidgetTopBar>
                )}
                <WidgetContent isInfinite={isInfinite} hasMoreItems={hasMoreItems} setPage={setPage}>
                    <Grid
                        aria-multiselectable={selectionEnabled ? selectionProps.selectionType === "Multi" : undefined}
                    >
                        <GridBody style={cssGridStyles}>
                            <div key="headers_row" className="tr" role="row">
                                <CheckboxColumnHeader key="headers_column_select_all" />
                                {columnsToShow.map((column, index) =>
                                    headerWrapperRenderer(
                                        index,
                                        <Header
                                            key={`${column.columnId}`}
                                            className={`align-column-${column.alignment}`}
                                            gridId={props.id}
                                            column={column}
                                            draggable={columnsDraggable}
                                            dragOver={dragOver}
                                            filterable={columnsFilterable}
                                            filterWidget={
                                                !useHeaderFilters ??
                                                filterRendererProp(renderFilterWrapper, column.columnNumber)
                                            }
                                            hidable={columnsHidable}
                                            isDragging={isDragging}
                                            preview={preview}
                                            resizable={columnsResizable}
                                            resizer={
                                                <ColumnResizer
                                                    minWidth={column.minWidth}
                                                    setColumnWidth={(width: number) =>
                                                        actions.resize([column.columnId, width])
                                                    }
                                                />
                                            }
                                            swapColumns={actions.swap}
                                            setDragOver={setDragOver}
                                            setIsDragging={setIsDragging}
                                            setSortBy={actions.sortBy}
                                            sortable={columnsSortable}
                                            sortRule={state.sortOrder.find(([id]) => column.columnId === id)}
                                            visibleColumns={state.visibleColumns}
                                            sortLoading={state.executingRemoteSort}
                                        />
                                    )
                                )}
                                {columnsHidable && (
                                    <ColumnSelector
                                        key="headers_column_selector"
                                        columns={state.availableColumns}
                                        hiddenColumns={state.hidden}
                                        id={id}
                                        toggleHidden={actions.toggleHidden}
                                        visibleLength={state.visibleColumns.length}
                                    />
                                )}
                            </div>
                            <KeyNavProvider
                                rows={props.data.length}
                                columns={keyboardNavColumnsCount}
                                pageSize={props.pageSize}
                            >
                                {rows.map((item, rowIndex) => {
                                    return (
                                        <Row
                                            CellComponent={CellComponent}
                                            className={props.rowClass?.(item)}
                                            columns={columnsToShow}
                                            index={rowIndex}
                                            item={item}
                                            key={`row_${item.id}`}
                                            rowAction={props.rowAction}
                                            showSelectorCell={columnsHidable}
                                            preview={preview ?? false}
                                            selectableWrapper={headerWrapperRenderer}
                                            dataAttributes={props.dataAttributes}
                                        />
                                    );
                                })}
                            </KeyNavProvider>
                            {(rows.length === 0 || preview) &&
                                emptyPlaceholderRenderer &&
                                emptyPlaceholderRenderer(children => (
                                    <div
                                        key="row-footer"
                                        className={classNames("td", { "td-borders": !preview })}
                                        style={{
                                            gridColumn: `span ${columnsVisibleCount}`
                                        }}
                                    >
                                        <div className="empty-placeholder">{children}</div>
                                    </div>
                                ))}
                        </GridBody>
                    </Grid>
                </WidgetContent>
                <WidgetFooter pagination={pagination} pagingPosition={pagingPosition} />
                <ExportWidget
                    alertLabel={props.exportDialogLabel ?? "Export progress"}
                    cancelLabel={props.cancelExportLabel ?? "Cancel data export"}
                    failed={false}
                    onCancel={onExportCancel}
                    open={exporting}
                    progress={processedRows}
                    total={numberOfItems}
                />
            </WidgetRoot>
        </WidgetPropsProvider>
    );
}

function gridStyle(
    columns: GridColumn[],
    resizeMap: GridModel.ColumnWidthConfig,
    optional: OptionalColumns
): CSSProperties {
    const columnSizes = columns.map(c => {
        const columnResizedSize = resizeMap[c.columnId];
        if (columnResizedSize) {
            return `${columnResizedSize}px`;
        }
        switch (c.width) {
            case "autoFit":
                return "fit-content(100%)";
            case "manual":
                return `${c.weight}fr`;
            default:
                return "1fr";
        }
    });

    const sizes: string[] = [];

    if (optional.selectItemColumn) {
        sizes.push("fit-content(48px)");
    }

    sizes.push(...columnSizes);

    if (optional.visibilitySelectorColumn) {
        sizes.push("fit-content(50px)");
    }

    return {
        gridTemplateColumns: sizes.join(" ")
    };
}

type OptionalColumns = {
    selectItemColumn?: boolean;
    visibilitySelectorColumn?: boolean;
};
