import {
    container,
    datasource,
    dropzone,
    rowLayout,
    selectable,
    StructurePreviewProps,
    text,
    structurePreviewPalette
} from "@mendix/widget-plugin-platform/preview/structure-preview-api";
import {
    changePropertyIn,
    hideNestedPropertiesIn,
    hidePropertiesIn,
    hidePropertyIn,
    Problem,
    Properties,
    transformGroupsIntoTabs
} from "@mendix/pluggable-widgets-tools";

import { ColumnsPreviewType, DatagridPreviewProps } from "../typings/DatagridProps";

export function getProperties(
    values: DatagridPreviewProps,
    defaultProperties: Properties,
    platform: "web" | "desktop"
): Properties {
    values.columns.forEach((column, index) => {
        if (column.showContentAs !== "attribute" && !column.sortable && !values.columnsFilterable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "attribute");
        }
        if (column.showContentAs !== "dynamicText") {
            hidePropertyIn(defaultProperties, values, "columns", index, "dynamicText");
        }
        if (column.showContentAs !== "customContent") {
            hidePropertyIn(defaultProperties, values, "columns", index, "content");
        }
        if (column.showContentAs === "customContent") {
            hidePropertyIn(defaultProperties, values, "columns", index, "tooltip");
        }
        if (!values.columnsSortable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "sortable");
        }
        if (!values.columnsFilterable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "filter");
        }
        if (!values.columnsResizable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "resizable");
        }
        if (!values.columnsDraggable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "draggable");
        }
        if (!values.columnsHidable) {
            hidePropertyIn(defaultProperties, values, "columns", index, "hidable");
        }
        if (column.width !== "manual") {
            hidePropertyIn(defaultProperties, values, "columns", index, "size");
        }
        if (!values.advanced && platform === "web") {
            hideNestedPropertiesIn(defaultProperties, values, "columns", index, [
                "columnClass",
                "sortable",
                "resizable",
                "draggable",
                "hidable"
            ]);
        }

        if (!column.filterAssociation) {
            hideNestedPropertiesIn(defaultProperties, values, "columns", index, [
                "filterAssociationOptions",
                "filterAssociationOptionLabel"
            ]);
        }
    });
    if (values.pagination === "virtualScrolling") {
        hidePropertyIn(defaultProperties, values, "pagingPosition");
    }
    // TODO re-enable this after migration
    // if (values.pagination !== "remote") {
    //     hidePropertiesIn(defaultProperties, values, [
    //         "pagingAction",
    //         "pagingDisplayType",
    //         "pagingTotalCount",
    //         "pagingPosition"
    //     ]);
    // }
    if (values.buttons.length === 0) {
        hidePropertyIn(defaultProperties, values, "buttons");
    }
    if (values.showEmptyPlaceholder === "none") {
        hidePropertyIn(defaultProperties, values, "emptyPlaceholder");
    }

    if (!values.onClick) {
        hidePropertyIn(defaultProperties, values, "onClick");
    }

    hideSelectionProperties(defaultProperties, values);

    changePropertyIn(
        defaultProperties,
        values,
        prop => {
            prop.objectHeaders = ["Caption", "Content", "Width", "Alignment"];
            prop.objects?.forEach((object, index) => {
                const column = values.columns[index];
                const header = column.header ? column.header : "[Empty caption]";
                const alignment = column.alignment;
                object.captions = [
                    header,
                    column.showContentAs === "attribute"
                        ? column.attribute
                            ? column.attribute
                            : "[No attribute selected]"
                        : column.showContentAs === "dynamicText"
                        ? column.dynamicText
                        : "Custom content",
                    column.width === "autoFill"
                        ? "Auto-fill"
                        : column.width === "autoFit"
                        ? "Auto-fit content"
                        : `Manual (${column.size})`,
                    alignment ? alignment.charAt(0).toUpperCase() + alignment.slice(1) : ""
                ];
            });
        },
        "columns"
    );

    if (platform === "web") {
        if (!values.advanced) {
            hidePropertiesIn(defaultProperties, values, [
                "pagination",
                "pagingPosition",
                "showEmptyPlaceholder",
                "rowClass",
                "columnsSortable",
                "columnsDraggable",
                "columnsResizable",
                "columnsHidable",
                "configurationAttribute",
                "onConfigurationChange",
                "filterList",
                "filtersPlaceholder",
                "filterSectionTitle"
            ]);
        }

        transformGroupsIntoTabs(defaultProperties);
    } else {
        hidePropertyIn(defaultProperties, values, "advanced");
    }

    return defaultProperties;
}

function hideSelectionProperties(defaultProperties: Properties, values: DatagridPreviewProps): void {
    const { itemSelection, itemSelectionMethod } = values;

    if (itemSelection === "None") {
        hidePropertiesIn(defaultProperties, values, ["itemSelectionMethod", "onSelectionChange"]);
    }

    if (itemSelection !== "Multi" || itemSelectionMethod !== "checkbox") {
        hidePropertyIn(defaultProperties, values, "showSelectAllToggle");
    }
}

export const getPreview = (
    values: DatagridPreviewProps,
    isDarkMode: boolean,
    spVersion: number[] = [0, 0, 0]
): StructurePreviewProps => {
    const [major, minor] = spVersion;
    const canHideDataSourceHeader = major > 9 || (major === 9 && minor >= 20);
    const palette = structurePreviewPalette[isDarkMode ? "dark" : "light"];

    const modeColor = (colorDark: string, colorLight: string): string => (isDarkMode ? colorDark : colorLight);

    const hasColumns = values.columns && values.columns.length > 0;
    const columnProps: ColumnsPreviewType[] = hasColumns
        ? values.columns
        : [
              {
                  alignment: "left",
                  attribute: "",
                  columnClass: "",
                  content: { widgetCount: 0, renderer: () => null },
                  draggable: false,
                  dynamicText: "Dynamic text",
                  filter: { widgetCount: 0, renderer: () => null },
                  filterAssociation: "",
                  filterAssociationOptionLabel: "",
                  filterAssociationOptions: {},
                  header: "Column",
                  hidable: "no",
                  resizable: false,
                  showContentAs: "attribute",
                  size: 1,
                  sortable: false,
                  tooltip: "",
                  visible: "true",
                  width: "autoFit",
                  wrapText: false,
                  sortProperty: "sort"
              }
          ];
    const columns = rowLayout({
        columnSize: "fixed"
    })(
        ...columnProps.map(column =>
            container({
                borders: true,
                grow: column.width === "manual" && column.size ? column.size : 1,
                backgroundColor:
                    values.columnsHidable && column.hidable === "hidden" ? modeColor("#3E3E3E", "#F5F5F5") : undefined
            })(
                column.showContentAs === "customContent"
                    ? dropzone(dropzone.hideDataSourceHeaderIf(canHideDataSourceHeader))(column.content)
                    : container({
                          padding: 8
                      })(
                          text({ fontSize: 10, fontColor: palette.text.secondary })(
                              column.showContentAs === "dynamicText"
                                  ? column.dynamicText ?? "Dynamic text"
                                  : `[${column.attribute ? column.attribute : "No attribute selected"}]`
                          )
                      )
            )
        )
    );
    const gridTitle = rowLayout({
        columnSize: "fixed",
        backgroundColor: palette.background.topbarData,
        borders: true,
        borderWidth: 1
    })(
        container({
            padding: 4
        })(text({ fontColor: palette.text.data })("Data grid 2"))
    );
    let gridHeaderWidgets = null;
    if (values.tableLabel.length === 0) {
        gridHeaderWidgets = rowLayout({
            columnSize: "fixed",
            borders: true
        })(
            dropzone(
                dropzone.placeholder("Place widgets like filter widget(s) and action button(s) here"),
                dropzone.hideDataSourceHeaderIf(canHideDataSourceHeader)
            )(values.filtersPlaceholder)
        );
    } else {
        gridHeaderWidgets = rowLayout({
            columnSize: "grow",
            borders: true
        })(
            container({
                padding: 4,
                grow: 0
            })(
                text({
                    bold: true,
                    fontSize: 11
                })(values.tableLabel)
            ),
            dropzone(
                dropzone.placeholder("Place button(s) here"),
                dropzone.hideDataSourceHeaderIf(canHideDataSourceHeader)
            )(values.filtersPlaceholder)
        );
    }

    const columnHeaders = rowLayout({
        columnSize: "fixed"
    })(
        ...columnProps.map(column => {
            const isColumnHidden = values.columnsHidable && column.hidable === "hidden";
            const content = container({
                borders: true,
                grow:
                    values.columns.length > 0
                        ? column.width === "manual" && column.size
                            ? column.size
                            : 1
                        : undefined,
                backgroundColor: isColumnHidden ? modeColor("#4F4F4F", "#DCDCDC") : palette.background.topbarStandard
            })(
                rowLayout({
                    columnSize: "grow"
                })(
                    container({
                        grow: 0,
                        backgroundColor: "#AEEdAA"
                    })(
                        container({
                            padding: column.visible.trim() === "" || column.visible.trim() === "true" ? 0 : 3
                        })()
                    ),
                    container({
                        padding: 8
                    })(
                        container({
                            grow: 1,
                            padding: 8
                        })(
                            text({
                                bold: true,
                                fontSize: 10,
                                fontColor: column.header
                                    ? undefined
                                    : isColumnHidden
                                    ? modeColor("#4F4F4F", "#DCDCDC")
                                    : palette.text.secondary
                            })(column.header ? column.header : "Header")
                        ),
                        ...(hasColumns && values.columnsFilterable
                            ? [
                                  dropzone(
                                      dropzone.placeholder("Place filter widget here"),
                                      dropzone.hideDataSourceHeaderIf(canHideDataSourceHeader)
                                  )(column.filter)
                              ]
                            : [])
                    )
                )
            );
            return values.columns.length > 0
                ? selectable(column, { grow: column.width === "manual" && column.size ? column.size : 1 })(
                      container()(content)
                  )
                : content;
        })
    );
    const customEmptyMessageWidgets =
        values.showEmptyPlaceholder === "custom"
            ? [
                  rowLayout({
                      columnSize: "fixed",
                      borders: true
                  })(
                      dropzone(
                          dropzone.placeholder("Empty list message: Place widgets here"),
                          dropzone.hideDataSourceHeaderIf(canHideDataSourceHeader)
                      )(values.emptyPlaceholder)
                  )
              ]
            : [];

    return container()(
        gridTitle,
        ...(canHideDataSourceHeader ? [datasource(values.datasource)()] : []),
        gridHeaderWidgets,
        columnHeaders,
        ...Array.from({ length: 5 }).map(() => columns),
        ...customEmptyMessageWidgets
    );
};

const columnPropPath = (prop: string, index: number): string => `columns/${index + 1}/${prop}`;

// const buttonsPropPath = (prop: string, index: number): string => `rowClickEvents/${index + 1}/${prop}`;

const checkAssociationSettings = (
    values: DatagridPreviewProps,
    column: ColumnsPreviewType,
    index: number
): Problem | undefined => {
    if (!values.columnsFilterable) {
        return;
    }

    if (!column.filterAssociation) {
        return;
    }

    if (!column.filterAssociationOptionLabel) {
        return {
            property: columnPropPath("filterAssociationOptionLabel", index),
            message: `A caption is required when using associations. Please set 'Option caption' property for column (${column.header})`
        };
    }
};

const checkFilteringSettings = (
    values: DatagridPreviewProps,
    column: ColumnsPreviewType,
    index: number
): Problem | undefined => {
    if (!values.columnsFilterable) {
        return;
    }

    if (!column.attribute && !column.filterAssociation) {
        return {
            property: columnPropPath("attribute", index),
            message: `An attribute or reference is required when filtering is enabled. Please select 'Attribute' or 'Reference' property for column (${column.header})`
        };
    }
};

const checkDisplaySettings = (
    _values: DatagridPreviewProps,
    column: ColumnsPreviewType,
    index: number
): Problem | undefined => {
    if (column.showContentAs === "attribute" && !column.attribute) {
        return {
            property: columnPropPath("attribute", index),
            message: `An attribute is required when 'Show' is set to 'Attribute'. Select the 'Attribute' property for column (${column.header})`
        };
    }
};

const checkSortingSettings = (
    values: DatagridPreviewProps,
    column: ColumnsPreviewType,
    index: number
): Problem | undefined => {
    if (!values.columnsSortable) {
        return;
    }

    if (column.sortable && !column.attribute) {
        return {
            property: columnPropPath("attribute", index),
            message: `An attribute is required when column sorting is enabled. Select the 'Attribute' property for column (${column.header}) or disable sorting in column settings`
        };
    }
};
/**
 * Single click events are only valid when selection is off or when the ctrlTrigger is used.
 */

const checkSelectionSettings = (values: DatagridPreviewProps): Problem[] => {
    const retVal: Problem[] = [];

    if (values.itemSelection !== "None" && values.onClick !== null) {
        retVal.push(
            ...values.rowClickevents
                .filter(rowClickEvent => {
                    return rowClickEvent.defaultTrigger === "singleClick" && !rowClickEvent.ctrlTrigger;
                })
                .map((): Problem => {
                    return {
                        property: "rowClickevents",
                        message:
                            '"Default trigger" must be set to "double click" or "ctrl trigger" must be set when "Selection" is enabled'
                    };
                })
        );
    }

    return retVal;
};

export function check(values: DatagridPreviewProps): Problem[] {
    const errors: Problem[] = [];

    const columnChecks = [checkAssociationSettings, checkFilteringSettings, checkDisplaySettings, checkSortingSettings];
    if (values.pagination === "remote") {
        if (!values.pagingTotalCount) {
            errors.push({
                property: "pagingTotalCount",
                message: "Paging total count is required when Pagination is Remote"
            });
        }
        if (!values.pagingAction) {
            errors.push({
                property: "pagingAction",
                message: "Paging action is required when Pagination is Remote"
            });
        }
        if (!values.pagingDisplayType) {
            errors.push({
                property: "pagingDisplayType",
                message: "Paging display type is required when Pagination is Remote"
            });
        }
        if (!values.pageSizeAttribute) {
            errors.push({
                property: "pageSizeAttribute",
                message: "Page size attribute is required when Pagination is Remote"
            });
        }
    }
    if (
        values.pagingPosition !== "bottom" &&
        values.filtersPlaceholder.widgetCount > 0 &&
        values.tableLabel.length > 0
    ) {
        errors.push({
            property: `pagingPosition`,
            message:
                "Paging position can only be bottom when widgets are placed in the header and the header text is set."
        });
    }

    // TODO Re-enable when migrating to 2G version
    if (values.onClick) {
        errors.push({
            property: `onClick`,
            message:
                "Action is removed please move action to Events / Click events. This action will not be executed on click"
        });
    }
    // if (values.buttons.length > 0) {
    //     errors.push({
    //         property: "buttons",
    //         message: "This implementation of buttons is no longer used, please move the buttons."
    //     });
    // }
    if (
        values.pagination !== "remote" &&
        !(!values.pageSize || !values.pageNumber || !values.pageSizeAttribute || !values.pagingAction)
    ) {
        errors.push({
            property: "pagination",
            message: `Pagination set as ${values.pagination} but Paging page size or page number are still set, please select set remote as pagination or remove the attributes from remote pagination`
        });
    }
    //On rowclick selection we cannot add a rowClickevent on single click
    if (values.itemSelectionMethod === "rowClick") {
        values.rowClickevents.forEach(x => {
            if (x.defaultTrigger === "singleClick") {
                errors.push({
                    property: "rowClickevents",
                    message:
                        "Button is single click execution but the item selection is set to row click, this action will never be executed."
                });
            }
        });
    }

    values.columns.forEach((column: ColumnsPreviewType, index) => {
        for (const check of columnChecks) {
            const error = check(values, column, index);
            if (error) {
                errors.push(error);
            }
        }

        if (values.columnsHidable && column.hidable !== "no" && !column.header) {
            errors.push({
                property: columnPropPath("hidable", index),
                message:
                    "A caption is required if 'Can hide' is Yes or Yes, hidden by default. This can be configured under 'Column capabilities' in the column item properties"
            });
        }
    });
    errors.push(...checkSelectionSettings(values));
    return errors;
}

export function getCustomCaption(values: DatagridPreviewProps): string {
    type DsProperty = { caption?: string };
    const dsProperty: DsProperty = datasource(values.datasource)().property ?? {};
    return dsProperty.caption || "Data grid 2";
}
