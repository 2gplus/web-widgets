import { SelectionType } from "@mendix/widget-plugin-grid/selection";
import { GridSelectionProps } from "@mendix/widget-plugin-grid/selection/useGridSelectionProps";
import { removeAllRanges } from "@mendix/widget-plugin-grid/selection/utils";
import { ObjectItem } from "mendix";
import { useMemo } from "react";

/**
 * This is sad, but originally row was behaving like a button when DG has a "On click" action.
 * For this case, there is still no good a11y pattern:
 * Discussion 1 - https://github.com/mu-semtech/ember-data-table/issues/20
 * Discussion 2 - https://github.com/dequelabs/axe-core/issues/1942
 * But, maybe that will change in the future?
 * For RowActAsButton, please check https://www.w3.org/WAI/ARIA/apg/patterns/button/#keyboardinteraction
 * For RowActAsSelectable, please check https://www.w3.org/WAI/ARIA/apg/patterns/grid/#datagridsforpresentingtabularinformation
 */
type RowPattern = "RowActAsButton" | "RowActAsSelectable" | "None";

type RowClickHandler = (e: any, isDoubleClick: boolean, value: ObjectItem) => void;

type OtherProps = {
    cellClickableClass: boolean;
    onRowClickHandler?: RowClickHandler;
};

type RowEventHandlers = {
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLDivElement>;
};

type ActionProp = RowClickHandler | undefined;

type RowInteractionProps = RowEventHandlers;

function getPattern(selectionType: SelectionType, action: ActionProp): RowPattern {
    if (selectionType === "Single" || selectionType === "Multi") {
        return "RowActAsSelectable";
    }

    if (action) {
        return "RowActAsButton";
    }

    return "None";
}

function rowPropsButton(item: ObjectItem, action: ActionProp): RowInteractionProps {
    const callback = (event: any, dblClick: boolean): void => (action ? action(event, dblClick, item) : undefined);

    let pressed = false;
    return {
        onClick: e => callback(e, false),
        onDoubleClick: e => callback(e, true),
        onKeyDown(event) {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }
            pressed = true;
        },
        onKeyUp(event) {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }

            if (isDirectChild(event.currentTarget, event.target as Element) && pressed) {
                callback(event, false);
            }

            pressed = false;
        }
    };
}

function rowPropsSelectable(
    item: ObjectItem,
    selectionProps: GridSelectionProps,
    action: ActionProp
): RowInteractionProps {
    if (selectionProps.selectionType === "None") {
        return {};
    }

    const callback = (item: ObjectItem, shiftKey: boolean): void => {
        selectionProps.onSelect(item, shiftKey);
    };

    const executeAction = (event: any, dblClick: boolean): void => (action ? action(event, dblClick, item) : undefined);

    return {
        onClick(event) {
            if (event.shiftKey) {
                removeAllRanges();
            }
            callback(item, event.shiftKey);
        },
        onDoubleClick(event) {
            executeAction(event, true);
        },
        onKeyDown(event) {
            selectionProps.onKeyDown?.(event, item);
        },
        onKeyUp(event) {
            selectionProps.onKeyUp?.(event, item);
        }
    };
}

function isDirectChild(row: Element, cell: Element): boolean {
    return Array.from(row.children).includes(cell);
}

export function useRowInteractionProps(
    item: ObjectItem,
    selectionProps: GridSelectionProps,
    action: ActionProp
): [RowInteractionProps, OtherProps] {
    function computeProps(): [RowInteractionProps, OtherProps] {
        const pattern = getPattern(selectionProps.selectionType, action);
        let props: RowInteractionProps = {};

        if (pattern === "RowActAsButton") {
            props = rowPropsButton(item, action);
        }

        if (pattern === "RowActAsSelectable") {
            props = rowPropsSelectable(item, selectionProps, action);
        }

        return [props, { cellClickableClass: pattern !== "None" }];
    }

    return useMemo(computeProps, [item, selectionProps, action]);
}
