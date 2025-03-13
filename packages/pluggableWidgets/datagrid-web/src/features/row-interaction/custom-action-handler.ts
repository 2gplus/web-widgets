import { ElementEntry, EventCaseEntry } from "@mendix/widget-plugin-grid/event-switch/base";
import { ClickActionHelper, ClickTrigger, ExecuteActionFx } from "@mendix/widget-plugin-grid/helpers/ClickActionHelper";
import { BaseContext, CellContext } from "./base";

export interface CustomCellContext extends BaseContext {
    clickTrigger: ClickTrigger;
    ctrlTrigger: boolean;
}

const onClick = (
    execActionFx: ExecuteActionFx,
    ctrlTrigger: boolean
): EventCaseEntry<CustomCellContext, HTMLDivElement, "onClick"> => ({
    eventName: "onClick",
    filter: (ctx, event) => {
        if (ctx.clickTrigger === "single" && ctx.selectionMethod === "none") {
            return true;
        }
        return !event.metaKey && ((!event.ctrlKey && !ctrlTrigger) || (ctrlTrigger && event.ctrlKey));
    },
    handler: ({ item }) => execActionFx(item)
});

const onDoubleClick = (
    execActionFx: ExecuteActionFx,
    ctrlTrigger: boolean
): EventCaseEntry<CustomCellContext, HTMLDivElement, "onDoubleClick"> => ({
    eventName: "onDoubleClick",
    filter: (ctx, event) => {
        if (ctx.selectionMethod === "none") {
            return ctx.clickTrigger === "double";
        }
        return !event.metaKey && ((!event.ctrlKey && !ctrlTrigger) || (ctrlTrigger && event.ctrlKey));
    },
    handler: ({ item }) => execActionFx(item)
});

export function createRowActionHandlers(
    clickActionHelper: ClickActionHelper
): Array<ElementEntry<CellContext, HTMLDivElement>> {
    switch (clickActionHelper.clickTrigger) {
        case "single":
            return [onClick(clickActionHelper.onExecuteAction, clickActionHelper.ctrlTrigger)];
        case "double":
            return [onDoubleClick(clickActionHelper.onExecuteAction, clickActionHelper.ctrlTrigger)];
        default:
            return [];
    }
}
