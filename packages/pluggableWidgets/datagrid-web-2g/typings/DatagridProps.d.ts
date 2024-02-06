/**
 * This file was generated from Datagrid.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, DynamicValue, EditableValue, ListValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListReferenceValue, ListReferenceSetValue, ListWidgetValue, SelectionSingleValue, SelectionMultiValue, WebIcon } from "mendix";
import { Big } from "big.js";

export type ItemSelectionMethodEnum = "checkbox" | "rowClick";

export type ShowContentAsEnum = "attribute" | "dynamicText" | "customContent";

export type HidableEnum = "yes" | "hidden" | "no";

export type WidthEnum = "autoFill" | "autoFit" | "manual";

export type AlignmentEnum = "left" | "center" | "right";

export interface ColumnsType {
    showContentAs: ShowContentAsEnum;
    attribute?: ListAttributeValue<string | Big | boolean | Date>;
    content?: ListWidgetValue;
    dynamicText?: ListExpressionValue<string>;
    header?: DynamicValue<string>;
    tooltip?: ListExpressionValue<string>;
    minWidth: number;
    filter?: ReactNode;
    filterAssociation?: ListReferenceValue | ListReferenceSetValue;
    filterAssociationOptions?: ListValue;
    filterAssociationOptionLabel?: ListExpressionValue<string>;
    sortProperty: string;
    visible?: DynamicValue<boolean>;
    sortable: boolean;
    resizable: boolean;
    draggable: boolean;
    hidable: HidableEnum;
    width: WidthEnum;
    size: number;
    alignment: AlignmentEnum;
    columnClass?: ListExpressionValue<string>;
    wrapText: boolean;
}

export type PaginationEnum = "buttons" | "remote" | "virtualScrolling";

export type PagingPositionEnum = "bottom" | "top" | "both";

export type ShowPagingButtonsEnum = "always" | "auto";

export type ShowEmptyPlaceholderEnum = "none" | "custom";

export type PagingDisplayTypeEnum = "objectBased" | "pageBased";

export type SortingTypeEnum = "local" | "remote";

export type DefaultTriggerEnum = "singleClick" | "doubleClick";

export interface RowClickeventsType {
    onClick?: ListActionValue;
    ctrlTrigger: boolean;
    defaultTrigger: DefaultTriggerEnum;
    documentation: string;
}

export interface DataObjectsType {
    attribute: string;
    data?: ListExpressionValue<string>;
}

export type CheckAuthEnum = "True" | "Attribute" | "False";

export type RenderModeEnum = "link" | "button";

export type ButtonStyleEnum = "default" | "inverse" | "primary" | "info" | "success" | "warning" | "danger";

export interface ButtonsType {
    caption?: DynamicValue<string>;
    action?: ListActionValue;
    actionNoContext?: ActionValue;
    tooltip?: DynamicValue<string>;
    icon?: DynamicValue<WebIcon>;
    checkAuth: CheckAuthEnum;
    checkAuthAttribute?: DynamicValue<boolean>;
    renderMode: RenderModeEnum;
    btnClass: string;
    iconClass: string;
    buttonStyle: ButtonStyleEnum;
}

export interface FilterListType {
    filter: ListAttributeValue<string | Big | boolean | Date>;
}

export interface ColumnsPreviewType {
    showContentAs: ShowContentAsEnum;
    attribute: string;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    dynamicText: string;
    header: string;
    tooltip: string;
    minWidth: number | null;
    filter: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    filterAssociation: string;
    filterAssociationOptions: {} | { caption: string } | { type: string } | null;
    filterAssociationOptionLabel: string;
    sortProperty: string;
    visible: string;
    sortable: boolean;
    resizable: boolean;
    draggable: boolean;
    hidable: HidableEnum;
    width: WidthEnum;
    size: number | null;
    alignment: AlignmentEnum;
    columnClass: string;
    wrapText: boolean;
}

export interface RowClickeventsPreviewType {
    onClick: {} | null;
    ctrlTrigger: boolean;
    defaultTrigger: DefaultTriggerEnum;
    documentation: string;
}

export interface DataObjectsPreviewType {
    attribute: string;
    data: string;
}

export interface ButtonsPreviewType {
    caption: string;
    action: {} | null;
    actionNoContext: {} | null;
    tooltip: string;
    icon: { type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined;
    checkAuth: CheckAuthEnum;
    checkAuthAttribute: string;
    renderMode: RenderModeEnum;
    btnClass: string;
    iconClass: string;
    buttonStyle: ButtonStyleEnum;
}

export interface FilterListPreviewType {
    filter: string;
}

export interface DatagridContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    tableLabel?: DynamicValue<string>;
    advanced: boolean;
    datasource: ListValue;
    refreshInterval: number;
    itemSelection?: SelectionSingleValue | SelectionMultiValue;
    itemSelectionMethod: ItemSelectionMethodEnum;
    showSelectAllToggle: boolean;
    columns: ColumnsType[];
    columnsFilterable: boolean;
    filtersAboveTable: boolean;
    pageSize: number;
    pagination: PaginationEnum;
    pagingPosition: PagingPositionEnum;
    showPagingButtons: ShowPagingButtonsEnum;
    showEmptyPlaceholder: ShowEmptyPlaceholderEnum;
    emptyPlaceholder?: ReactNode;
    rowClass?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    onSelectionChange?: ActionValue;
    pagingAction?: ActionValue;
    pagingDisplayType: PagingDisplayTypeEnum;
    pagingTotalCount?: EditableValue<Big>;
    pageNumber?: EditableValue<Big>;
    pageSizeAttribute?: EditableValue<Big>;
    sortingType: SortingTypeEnum;
    sortAttribute?: EditableValue<string>;
    sortAscending?: EditableValue<boolean>;
    onSortChangedAction?: ActionValue;
    executeSortChangedActionOnStartup: boolean;
    rowClickevents: RowClickeventsType[];
    dataObjects: DataObjectsType[];
    buttons: ButtonsType[];
    columnsSortable: boolean;
    columnsResizable: boolean;
    columnsDraggable: boolean;
    columnsHidable: boolean;
    configurationAttribute?: EditableValue<string>;
    filterList: FilterListType[];
    filtersPlaceholder?: ReactNode;
    filterSectionTitle?: DynamicValue<string>;
    exportDialogLabel?: DynamicValue<string>;
    cancelExportLabel?: DynamicValue<string>;
    selectRowLabel?: DynamicValue<string>;
}

export interface DatagridPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    tableLabel: string;
    advanced: boolean;
    datasource: {} | { caption: string } | { type: string } | null;
    refreshInterval: number | null;
    itemSelection: "None" | "Single" | "Multi";
    itemSelectionMethod: ItemSelectionMethodEnum;
    showSelectAllToggle: boolean;
    columns: ColumnsPreviewType[];
    columnsFilterable: boolean;
    filtersAboveTable: boolean;
    pageSize: number | null;
    pagination: PaginationEnum;
    pagingPosition: PagingPositionEnum;
    showPagingButtons: ShowPagingButtonsEnum;
    showEmptyPlaceholder: ShowEmptyPlaceholderEnum;
    emptyPlaceholder: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    rowClass: string;
    onClick: {} | null;
    onSelectionChange: {} | null;
    pagingAction: {} | null;
    pagingDisplayType: PagingDisplayTypeEnum;
    pagingTotalCount: string;
    pageNumber: string;
    pageSizeAttribute: string;
    sortingType: SortingTypeEnum;
    sortAttribute: string;
    sortAscending: string;
    onSortChangedAction: {} | null;
    executeSortChangedActionOnStartup: boolean;
    rowClickevents: RowClickeventsPreviewType[];
    dataObjects: DataObjectsPreviewType[];
    buttons: ButtonsPreviewType[];
    columnsSortable: boolean;
    columnsResizable: boolean;
    columnsDraggable: boolean;
    columnsHidable: boolean;
    configurationAttribute: string;
    onConfigurationChange: {} | null;
    filterList: FilterListPreviewType[];
    filtersPlaceholder: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    filterSectionTitle: string;
    exportDialogLabel: string;
    cancelExportLabel: string;
    selectRowLabel: string;
}
