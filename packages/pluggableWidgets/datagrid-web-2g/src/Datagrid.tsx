import { createElement, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColumnsType, DatagridContainerProps } from "../typings/DatagridProps";
import { FilterCondition } from "mendix/filters";
import { and } from "mendix/filters/builders";
import { Table, TableColumn } from "./components/Table";
import {
    FilterFunction,
    FilterType,
    generateUUID,
    useFilterContext,
    useMultipleFiltering
} from "@mendix/pluggable-widgets-commons/components/web";
import {
    executeAction,
    getGlobalSelectionContext,
    isAvailable,
    useCreateSelectionContextValue,
    useSelectionHelper
} from "@mendix/pluggable-widgets-commons";
import { extractFilters } from "./features/filters";
import { useCellRenderer } from "./features/cell";
import { getColumnAssociationProps, isSortable } from "./features/column";
import { selectionSettings, useOnSelectProps } from "./features/selection";
import "./ui/Datagrid.scss";
import { Big } from "big.js";
import { debounce } from "./utils/debounce";
import { ObjectItem } from "mendix";

export interface RemoteSortConfig {
    property?: string;
    ascending?: boolean;
}

export default function Datagrid(props: DatagridContainerProps): ReactElement {
    const id = useRef(`DataGrid${generateUUID()}`);

    const [sortParameters, setSortParameters] = useState<{ columnIndex: number; desc: boolean } | undefined>(undefined);
    const isInfiniteLoad = props.pagination === "virtualScrolling";
    const currentPage =
        props.pagination !== "remote"
            ? isInfiniteLoad
                ? props.datasource.limit / props.pageSize
                : props.datasource.offset / props.pageSize
            : props.pageNumber && props.pageNumber.value
            ? props.pageNumber.value.toNumber()
            : 0;
    const viewStateFilters = useRef<FilterCondition | undefined>(undefined);
    const [filtered, setFiltered] = useState(false);
    const multipleFilteringState = useMultipleFiltering();
    const { FilterContext } = useFilterContext();
    const SelectionContext = getGlobalSelectionContext();

    /**
     * 2G button events
     */
    const hasDblClick = props.rowClickevents.findIndex(clickEvent => clickEvent.defaultTrigger === "doubleClick") > -1;
    let timeout: NodeJS.Timeout;
    const rowClickhandler = (e: any, dblClick: boolean, value: ObjectItem) => {
        // If the events on the data grid have doubleclick action we want to wait when the user click on a row, since the user can doubleclick the row.
        let waitTime = 0;
        if (hasDblClick) {
            waitTime = 250;
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            let logMessage;
            if (props.rowClickevents.length > 0) {
                // filter the action where the trigger and ctrl key event are equal
                const eventsToExecute = props.rowClickevents.filter(
                    clickEvent =>
                        (clickEvent.defaultTrigger === "doubleClick") === dblClick &&
                        e.ctrlKey === clickEvent.ctrlTrigger
                );
                logMessage = "Executing actions, logging documentation";
                for (const clickEvent of eventsToExecute) {
                    logMessage += `\r\n${clickEvent.documentation}`;
                    if (clickEvent.onClick) {
                        const action = clickEvent.onClick.get(value);
                        if (action.canExecute) {
                            executeAction(action);
                        }
                    }
                }
            }
            console.log(logMessage);
            // Custom implementation of the selection on row click
            if (props.itemSelectionMethod === "rowClick" && !dblClick) {
                selectActionProps.onSelect(value);
            }
        }, waitTime);
    };
    /**
     *   End button events
     */
    const cellRenderer = useCellRenderer({ columns: props.columns, onClick: rowClickhandler });
    /**
     * 2G Remote sorting
     */
    const [remoteSortConfig, setRemoteSortConfig] = useState<RemoteSortConfig>({
        ascending: props.sortAscending?.value,
        property: props.sortAttribute?.value
    });
    const timer = useRef<any>(null);
    const [isStarted, setIsStarted] = useState<boolean>(false);

    const updateRemoteSortConfig = (newConfig: RemoteSortConfig) => {
        let changed = false;
        // check if any property is set
        if (newConfig.property) {
            if (newConfig.ascending != null && newConfig.ascending !== props.sortAscending?.value) {
                console.log("[datagrid2g] sort ascending changed");
                props.sortAscending?.setValue(newConfig.ascending);
                changed = true;
            }
            if (newConfig.property && newConfig.property !== props.sortAttribute?.value) {
                console.log("[datagrid2g] sort attribute changed");
                props.sortAttribute?.setValue(newConfig.property);
                changed = true;
            }
        } else {
            if (props.sortAttribute?.value) {
                console.log("[datagrid2g] sort reset to undefined");
                props.sortAttribute?.setValue(undefined);
                changed = true;
            }
        }
        // only execute the changed action when we are started to prevent double loading
        if (changed && isStarted) {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                props.onSortChangedAction?.execute();
            }, 40);
        }
    };

    /**
     * called after the remote sort has been set.
     * If the execute on startup is true we can call the on sort changed action
     */
    const onIsStarted = useMemo(
        () =>
            debounce(() => {
                if (isStarted === false) {
                    if (props.executeSortChangedActionOnStartup === true) {
                        props.onSortChangedAction?.execute();
                    }
                    setIsStarted(true);
                }
            }, 100),
        [isStarted]
    );

    // only call once
    useEffect(() => {
        if (props.sortingType === "remote") {
            if (
                props.sortAscending?.value !== remoteSortConfig.ascending ||
                props.sortAttribute?.value !== remoteSortConfig.property
            ) {
                setRemoteSortConfig({
                    ascending: props.sortAscending?.value,
                    property: props.sortAttribute?.value
                });
            }
        }
    }, []);

    /**
     * End 2G Remote Sorting
     */
    const pageSize =
        props.pagination !== "remote"
            ? props.pageSize
            : props.pageSizeAttribute && props.pageSizeAttribute.value
            ? props.pageSizeAttribute.value.toNumber()
            : 0;
    const [totalCount, setTotalCount] = useState<number>();
    const [hasMoreItems, setHasMoreItems] = useState<boolean>(false);
    useEffect(() => {
        props.datasource.requestTotalCount(true);
        if (props.datasource.limit === Number.POSITIVE_INFINITY) {
            props.datasource.setLimit(props.pageSize);
        }
    }, [props.datasource, props.pageSize]);

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
                    props.datasource.setLimit(props.pageSize);
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
        computePage => {
            const newPage = computePage(currentPage);
            if (isInfiniteLoad) {
                props.datasource.setLimit(newPage * props.pageSize);
            } else if (props.pagination === "buttons") {
                props.datasource.setOffset(newPage * props.pageSize);
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
        [props.datasource, props.pageSize, isInfiniteLoad, currentPage]
    );

    // TODO: Rewrite this logic with single useReducer (or write
    // custom hook that will use useReducer)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const customFiltersState = props.columns.map(() => useState<FilterFunction>());

    const filters = customFiltersState
        .map(([customFilter]) => customFilter?.getFilterCondition?.())
        .filter((filter): filter is FilterCondition => filter !== undefined)
        .concat(
            // Concatenating multiple filter state
            Object.keys(multipleFilteringState)
                .map((key: FilterType) => multipleFilteringState[key][0]?.getFilterCondition())
                .filter((filter): filter is FilterCondition => filter !== undefined)
        );

    if (filters.length > 0) {
        props.datasource.setFilter(filters.length > 1 ? and(...filters) : filters[0]);
    } else if (filtered) {
        props.datasource.setFilter(undefined);
    } else {
        props.datasource.setFilter(viewStateFilters.current);
    }

    if (sortParameters) {
        props.datasource.setSortOrder([
            [props.columns[sortParameters.columnIndex].attribute!.id, sortParameters.desc ? "desc" : "asc"]
        ]);
    } else {
        props.datasource.setSortOrder(undefined);
    }

    const columns = useMemo(() => transformColumnProps(props.columns), [props.columns]);

    /**
     * Multiple filtering properties
     */
    const filterList = useMemo(
        () => props.filterList.reduce((filters, { filter }) => ({ ...filters, [filter.id]: filter }), {}),
        [props.filterList]
    );
    const multipleInitialFilters = useMemo(
        () =>
            props.filterList.reduce(
                (filters, { filter }) => ({
                    ...filters,
                    [filter.id]: extractFilters(filter, viewStateFilters.current)
                }),
                {}
            ),
        [props.filterList]
    );

    const selection = useSelectionHelper(props.itemSelection, props.datasource, props.onSelectionChange);
    const selectActionProps = useOnSelectProps(selection);
    const { selectionStatus, selectionMethod } = selectionSettings(props, selection);

    const selectionContextValue = useCreateSelectionContextValue(selection);

    return (
        <Table
            selectionStatus={selectionStatus}
            selectionMethod={selectionMethod}
            cellRenderer={cellRenderer}
            className={props.class}
            columns={columns}
            columnsDraggable={props.columnsDraggable}
            columnsFilterable={props.columnsFilterable}
            columnsHidable={props.columnsHidable}
            columnsResizable={props.columnsResizable}
            columnsSortable={props.columnsSortable}
            data={props.datasource.items ?? []}
            emptyPlaceholderRenderer={useCallback(
                renderWrapper =>
                    props.showEmptyPlaceholder === "custom" ? renderWrapper(props.emptyPlaceholder) : <div />,
                [props.emptyPlaceholder, props.showEmptyPlaceholder]
            )}
            filterRenderer={useCallback(
                (renderWrapper, columnIndex) => {
                    const column = props.columns[columnIndex];
                    const { attribute, filter } = column;
                    const associationProps = getColumnAssociationProps(column);
                    const [, filterDispatcher] = customFiltersState[columnIndex];
                    const initialFilters = extractFilters(attribute, viewStateFilters.current);

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
            hasMoreItems={hasMoreItems}
            headerWrapperRenderer={useCallback((_columnIndex: number, header: ReactElement) => header, [])}
            gridHeaderWidgets={useMemo(
                () => (
                    <FilterContext.Provider
                        value={{
                            filterDispatcher: prev => {
                                if (prev.filterType) {
                                    const [, filterDispatcher] = multipleFilteringState[prev.filterType];
                                    filterDispatcher(prev);
                                    setFiltered(true);
                                }
                                return prev;
                            },
                            multipleAttributes: filterList,
                            multipleInitialFilters
                        }}
                    >
                        <SelectionContext.Provider value={selectionContextValue}>
                            {props.filtersPlaceholder}
                        </SelectionContext.Provider>
                    </FilterContext.Provider>
                ),
                [FilterContext, filterList, multipleInitialFilters, props.filtersPlaceholder, multipleFilteringState]
            )}
            gridHeaderTitle={props.filterSectionTitle?.value}
            id={id.current}
            numberOfItems={totalCount}
            page={currentPage}
            pageSize={props.pageSize}
            paging={props.pagination !== "virtualScrolling"}
            pagingPosition={props.pagingPosition}
            rowClass={useCallback(value => props.rowClass?.get(value)?.value ?? "", [props.rowClass])}
            setPage={setPage}
            setSortParameters={setSortParameters}
            settings={props.configurationAttribute}
            styles={props.style}
            valueForSort={useCallback(
                (value, columnIndex) => {
                    const column = props.columns[columnIndex];
                    return column.attribute ? column.attribute.get(value).value : "";
                },
                [props.columns]
            )}
            onSelect={selectActionProps.onSelect}
            onSelectAll={selectActionProps.onSelectAll}
            isSelected={selectActionProps.isSelected}
            updateRemoteSortConfig={updateRemoteSortConfig}
            remoteSortConfig={remoteSortConfig}
            onIsStarted={onIsStarted}
            rowOnClickHandler={rowClickhandler}
            dataAttributes={props.dataObjects}
            headerText={props.tableLabel}
        />
    );
}

function transformColumnProps(props: ColumnsType[]): TableColumn[] {
    return props.map(prop => ({
        ...prop,
        header: prop.header && isAvailable(prop.header) ? prop.header.value ?? "" : "",
        sortable: isSortable(prop)
    }));
}
