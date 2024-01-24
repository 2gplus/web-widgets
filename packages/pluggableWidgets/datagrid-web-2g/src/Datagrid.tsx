import {
    FilterState,
    FilterType,
    useFilterContext,
    useMultipleFiltering,
    readInitFilterValues
} from "@mendix/widget-plugin-filtering";
import { useCreateSelectionContextValue, useSelectionHelper } from "@mendix/widget-plugin-grid/selection";
import { useGridSelectionProps } from "@mendix/widget-plugin-grid/selection/useGridSelectionProps";
import { generateUUID } from "@mendix/widget-plugin-platform/framework/generate-uuid";
import { FilterCondition } from "mendix/filters";
import { and } from "mendix/filters/builders";
import { ReactElement, ReactNode, createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DatagridContainerProps } from "../typings/DatagridProps";
import { Cell } from "./components/Cell";
import { Widget } from "./components/Widget";
import { WidgetHeaderContext } from "./components/WidgetHeaderContext";
import { getColumnAssociationProps } from "./features/column";
import { UpdateDataSourceFn, useDG2ExportApi } from "./features/export";
import { Column } from "./helpers/Column";
import "./ui/Datagrid.scss";
import { StateChangeFx, useGridState } from "./features/model/use-grid-state";
import { useShowPagination } from "./utils/useShowPagination";
import { useModel } from "./features/model/use-model";
import { InitParams } from "./typings/GridModel";
import { executeAction } from "../../../shared/pluggable-widgets-commons/dist";
import { ObjectItem } from "mendix";
import { Big } from "big.js";

interface Props extends DatagridContainerProps {
    mappedColumns: Column[];
    initParams: InitParams;
    onStateChange: StateChangeFx;
}

export interface RemoteSortConfig {
    property?: string;
    ascending?: boolean;
}

function Container(props: Props): ReactElement {
    const isInfiniteLoad = props.pagination === "virtualScrolling";
    const pageSize =
        props.pagination !== "remote"
            ? props.pageSize
            : props.pageSizeAttribute && props.pageSizeAttribute.value
            ? props.pageSizeAttribute.value.toNumber()
            : 0;
    console.log(pageSize);
    const currentPage =
        props.pagination !== "remote"
            ? isInfiniteLoad
                ? props.datasource.limit / pageSize
                : props.datasource.offset / pageSize
            : props.pageNumber && props.pageNumber.value
            ? props.pageNumber.value.toNumber()
            : 0;
    const viewStateFilters = useRef<FilterCondition | undefined>(undefined);
    const [filtered, setFiltered] = useState(false);
    const multipleFilteringState = useMultipleFiltering();
    const { FilterContext } = useFilterContext();

    const [state, actions] = useGridState(props.initParams, props.mappedColumns, props.onStateChange);

    const [{ items, exporting, processedRows }, { abort }] = useDG2ExportApi({
        columns: state.visibleColumns.map(column => props.columns[column.columnNumber]),
        hasMoreItems: props.datasource.hasMoreItems || false,
        items: props.datasource.items,
        name: props.name,
        offset: props.datasource.offset,
        limit: props.datasource.limit,
        updateDataSource: useCallback<UpdateDataSourceFn>(
            ({ offset, limit, reload }) => {
                if (offset != null) {
                    props.datasource?.setOffset(offset);
                }

                if (limit != null) {
                    props.datasource?.setLimit(limit);
                }

                if (reload) {
                    props.datasource.reload();
                }
            },
            [props.datasource]
        )
    });

    const [hasMoreItems, setHasMoreItems] = useState<boolean>(false);
    const [totalCount, setTotalCount] = useState<number>();
    // const [sortParameters, setSortParameters] = useState<{ columnIndex: number; desc: boolean } | undefined>(undefined);

    /**
     * 2G button events
     */
    const hasConflictingActionClick =
        props.rowClickevents.findIndex(clickEvent => clickEvent.defaultTrigger === "doubleClick") > -1 &&
        props.rowClickevents.findIndex(clickEvent => clickEvent.defaultTrigger === "singleClick") > -1;
    let timeout: NodeJS.Timeout;
    const rowClickhandler = (e: any, dblClick: boolean, value: ObjectItem) => {
        // If the events on the data grid have doubleclick and singleClick action we want to wait when the user click on a row, since the user can doubleclick the row.
        let waitTime = 0;
        if (hasConflictingActionClick) {
            waitTime = 250;
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (props.rowClickevents.length > 0) {
                // let logMessage = "";
                // filter the action where the trigger and ctrl key event are equal
                const eventsToExecute = props.rowClickevents.filter(
                    clickEvent =>
                        (clickEvent.defaultTrigger === "doubleClick") === dblClick &&
                        e.ctrlKey === clickEvent.ctrlTrigger
                );
                // logMessage = "Executing actions, logging documentation";
                for (const clickEvent of eventsToExecute) {
                    // logMessage += `\r\n${clickEvent.documentation}`;
                    if (clickEvent.onClick) {
                        const action = clickEvent.onClick.get(value);
                        if (action.canExecute) {
                            executeAction(action);
                        }
                    }
                }
            }
            // Custom implementation of the selection on row click
            if (props.itemSelectionMethod === "rowClick" && !dblClick) {
                // selectActionProps.onSelect(value); TODO re-implement select action when row is clicked;
            }
        }, waitTime);
    };
    /**
     *   End button events
     */
    useEffect(() => {
        if (props.onSortChangedAction) actions.setRemoteExecuting(props.onSortChangedAction?.isExecuting);
    }, [props.onSortChangedAction?.isExecuting]);

    useEffect(() => {
        if (props.datasource.filter && !filtered && !viewStateFilters.current) {
            viewStateFilters.current = props.datasource.filter;
        }
    }, [props.datasource, props.configurationAttribute, filtered]);

    useEffect(() => {
        if (props.refreshInterval > 0) {
            setTimeout(() => {
                props.datasource.reload();
            }, props.refreshInterval * 1000);
        }
    }, [props.datasource, props.refreshInterval]);

    useEffect(() => {
        switch (props.pagination) {
            case "buttons":
            case "virtualScrolling":
                props.datasource.requestTotalCount(true);
                if (props.datasource.totalCount) {
                    setTotalCount(props.datasource.totalCount);
                    setHasMoreItems(props.datasource.hasMoreItems ?? false);
                }
                if (props.datasource.limit === Number.POSITIVE_INFINITY) {
                    props.datasource.setLimit(pageSize);
                }
                break;
            case "remote":
                if (props.pagingTotalCount && props.pagingTotalCount.value) {
                    const totalCountNumber = props.pagingTotalCount.value.toNumber();
                    if (totalCountNumber !== totalCount) {
                        setTotalCount(totalCountNumber);
                    }
                    setHasMoreItems(currentPage + 1 < Math.ceil(totalCountNumber / pageSize));
                }
                break;
        }
    }, [props.datasource, pageSize, currentPage]);

    const setPage = useCallback(
        (computePage: (prevPage: number) => number) => {
            const newPage = computePage(currentPage);
            if (isInfiniteLoad) {
                props.datasource.setLimit(newPage * pageSize);
            } else if (props.pagination === "buttons") {
                props.datasource.setOffset(newPage * pageSize);
            } else if (
                props.pagination === "remote" &&
                props.pageNumber &&
                props.pagingAction &&
                props.pagingAction.canExecute &&
                props.pagingTotalCount
            ) {
                props.pageNumber.setValue(new Big(newPage));
                props.pagingAction.execute();
                const totalCount = props.pagingTotalCount?.value?.toNumber() || 0;
                setHasMoreItems(newPage + 1 < Math.ceil(pageSize / totalCount));
            }
        },
        [props.datasource, pageSize, isInfiniteLoad, currentPage]
    );

    // TODO: Rewrite this logic with single useReducer (or write
    // custom hook that will use useReducer)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const customFiltersState = props.columns.map(() => useState<FilterState>());
    const deps1 = customFiltersState.map(([state]) => state);
    const deps2 = Object.keys(multipleFilteringState).map((key: FilterType) => multipleFilteringState[key][0]);

    const filters = useMemo(() => {
        return customFiltersState
            .map(([customFilter]) => customFilter?.getFilterCondition?.())
            .filter((filter): filter is FilterCondition => filter !== undefined)
            .concat(
                // Concatenating multiple filter state
                Object.keys(multipleFilteringState)
                    .map((key: FilterType) => multipleFilteringState[key][0]?.getFilterCondition())
                    .filter((filter): filter is FilterCondition => filter !== undefined)
            );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps1, ...deps2]);

    useEffect(() => {
        if (filters.length > 0) {
            actions.setFilter(filters.length > 1 ? and(...filters) : filters[0]);
        } else if (filtered) {
            actions.setFilter(undefined);
        } else {
            actions.setFilter(viewStateFilters.current);
        }
    }, [filters, filtered, actions]);

    const selectionHelper = useSelectionHelper(
        props.itemSelection,
        props.datasource,
        props.onSelectionChange,
        pageSize
    );
    const selectionContextValue = useCreateSelectionContextValue(selectionHelper);
    const selectionProps = useGridSelectionProps({
        selection: props.itemSelection,
        selectionMethod: props.itemSelectionMethod,
        helper: selectionHelper,
        showSelectAllToggle: props.showSelectAllToggle
    });

    return (
        <Widget
            className={props.class}
            CellComponent={Cell}
            columnsDraggable={props.columnsDraggable}
            columnsFilterable={props.columnsFilterable}
            columnsHidable={props.columnsHidable}
            columnsResizable={props.columnsResizable}
            columnsSortable={props.columnsSortable}
            data={items}
            emptyPlaceholderRenderer={useCallback(
                (renderWrapper: (children: ReactNode) => ReactElement) =>
                    props.showEmptyPlaceholder === "custom" ? renderWrapper(props.emptyPlaceholder) : <div />,
                [props.emptyPlaceholder, props.showEmptyPlaceholder]
            )}
            filterRenderer={useCallback(
                (renderWrapper, columnIndex) => {
                    const column = props.columns[columnIndex];
                    const { attribute, filter } = column;
                    const associationProps = getColumnAssociationProps(column);
                    const [, filterDispatcher] = customFiltersState[columnIndex];
                    const initialFilters = readInitFilterValues(attribute, viewStateFilters.current);

                    if (!attribute && !associationProps) {
                        return renderWrapper(filter);
                    }

                    return renderWrapper(
                        <FilterContext.Provider
                            value={{
                                filterDispatcher: prev => {
                                    setFiltered(true);
                                    filterDispatcher(prev);
                                    return prev;
                                },
                                singleAttribute: attribute,
                                singleInitialFilter: initialFilters,
                                associationProperties: associationProps
                            }}
                        >
                            {filter}
                        </FilterContext.Provider>
                    );
                },
                [FilterContext, customFiltersState, props.columns]
            )}
            headerTitle={props.filterSectionTitle?.value}
            headerContent={
                props.filtersPlaceholder && (
                    <WidgetHeaderContext
                        filterList={props.filterList}
                        setFiltered={setFiltered}
                        viewStateFilters={viewStateFilters.current}
                        selectionContextValue={selectionContextValue}
                        state={multipleFilteringState}
                    >
                        {props.filtersPlaceholder}
                    </WidgetHeaderContext>
                )
            }
            hasMoreItems={hasMoreItems}
            headerWrapperRenderer={useCallback((_columnIndex: number, header: ReactElement) => header, [])}
            id={useMemo(() => `DataGrid${generateUUID()}`, [])}
            numberOfItems={totalCount}
            onExportCancel={abort}
            page={currentPage}
            pageSize={pageSize}
            paging={useShowPagination({
                pagination: props.pagination,
                showPagingButtons: props.showPagingButtons,
                totalCount: props.datasource.totalCount,
                limit: props.datasource.limit
            })}
            pagingPosition={props.pagingPosition}
            rowClass={useCallback((value: any) => props.rowClass?.get(value)?.value ?? "", [props.rowClass])}
            setPage={setPage}
            styles={props.style}
            valueForSort={useCallback(
                (value, columnIndex) => {
                    const column = props.columns[columnIndex];
                    return column.attribute ? column.attribute.get(value).value : "";
                },
                [props.columns]
            )}
            rowAction={rowClickhandler}
            selectionProps={selectionProps}
            selectionStatus={selectionHelper?.type === "Multi" ? selectionHelper.selectionStatus : "unknown"}
            exporting={exporting}
            processedRows={processedRows}
            exportDialogLabel={props.exportDialogLabel?.value}
            cancelExportLabel={props.cancelExportLabel?.value}
            selectRowLabel={props.selectRowLabel?.value}
            state={state}
            actions={actions}
            /**
             * Custom 2G props
             */
            rowOnClickHandler={rowClickhandler}
            dataAttributes={props.dataObjects}
            headerText={props.tableLabel}
        />
    );
}

export default function Datagrid(props: DatagridContainerProps): ReactElement | null {
    const { initState, columns, stateChangeFx: onStateChange } = useModel(props);
    if (initState.status === "pending") {
        return null;
    }

    return (
        <Container {...props} initParams={initState.initParams} mappedColumns={columns} onStateChange={onStateChange} />
    );
}
