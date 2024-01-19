import classNames from "classnames";
import { ObjectItem } from "mendix";
import { ReactElement, createElement } from "react";
import { useWidgetProps } from "../helpers/useWidgetProps";
import { useRowInteractionProps } from "../helpers/useRowInteractionProps";
import { CellComponent } from "../typings/CellComponent";
import { GridColumn } from "../typings/GridColumn";
import { SelectorCell } from "./SelectorCell";
import { CheckboxCell } from "./CheckboxCell";
import { DataObjectsType } from "../../typings/DatagridProps";

export interface RowProps<C extends GridColumn> {
    className?: string;
    CellComponent: CellComponent<C>;
    columns: C[];
    item: ObjectItem;
    index: number;
    showSelectorCell?: boolean;
    rowAction?: (e: any, isDoubleClick: boolean, value: ObjectItem) => void;
    preview: boolean;
    selectableWrapper: (column: number, children: React.ReactElement) => React.ReactElement;
    dataAttributes?: DataObjectsType[];
}

export function Row<C extends GridColumn>(props: RowProps<C>): ReactElement {
    const { CellComponent: Cell, index: rowIndex } = props;
    const { selectionProps, preview, selectRowLabel, data } = useWidgetProps();
    const selected = selectionProps.isSelected(props.item);
    const ariaSelected = selectionProps.selectionType === "None" ? undefined : selected;
    const [interactionProps, { cellClickableClass }] = useRowInteractionProps(
        props.item,
        selectionProps,
        props.rowAction
    );
    const fragmentProps: any = {};
    if (props.dataAttributes) {
        for (const dataObject of props.dataAttributes) {
            fragmentProps[`data-${dataObject.attribute}`] = dataObject.data?.get(props.item)?.value;
        }
    }
    return (
        <div
            className={classNames("tr", { "tr-selected": selected }, props.className)}
            role="row"
            aria-selected={ariaSelected}
            {...interactionProps}
            {...fragmentProps}
        >
            {selectionProps.showCheckboxColumn && (
                <CheckboxCell
                    key="checkbox_cell"
                    borderTop={rowIndex === 0}
                    clickable={cellClickableClass}
                    rowIndex={rowIndex}
                    columnIndex={0}
                    checked={selected}
                    onInputClick={interactionProps.onClick}
                    checkboxAriaLabel={selectRowLabel}
                    lastRow={rowIndex === data.length - 1}
                />
            )}
            {props.columns.map((column, baseIndex) => {
                const cell = (
                    <Cell
                        key={`row_${props.item.id}_col_${column.columnNumber}`}
                        column={column}
                        rowIndex={props.index}
                        columnIndex={selectionProps.showCheckboxColumn ? baseIndex + 1 : baseIndex}
                        item={props.item}
                        clickable={cellClickableClass}
                        preview={preview}
                    />
                );

                return preview ? props.selectableWrapper(baseIndex, cell) : cell;
            })}
            {props.showSelectorCell && (
                <SelectorCell
                    key="column_selector_cell"
                    borderTop={rowIndex === 0}
                    clickable={cellClickableClass}
                    tabIndex={-1}
                />
            )}
        </div>
    );
}
