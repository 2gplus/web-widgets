import { ElementEntry, EventCaseEntry } from "@mendix/widget-plugin-grid/event-switch/base";
import { ClickActionHelper, ExecuteActionFx } from "../../helpers/ClickActionHelper";
import {CellContext} from "./base";



const onClick = (
    clickActionHelper: ClickActionHelper,
): EventCaseEntry<CellContext, HTMLDivElement, "onClick"> => ({
    eventName: "onClick",
    filter: (_ctx, event) => {
        return preventDoubleExecution(clickActionHelper) && !event.metaKey && ((!event.ctrlKey && !clickActionHelper.ctrlTrigger) || (clickActionHelper.ctrlTrigger && event.ctrlKey));
    },
    handler: ({ item }) => clickActionHelper.onExecuteAction(item)
});

const onDoubleClick = (
    execActionFx: ExecuteActionFx,
    ctrlTrigger: boolean
): EventCaseEntry<CellContext, HTMLDivElement, "onDoubleClick"> => ({
    eventName: "onDoubleClick",
    filter: (_ctx, event) => {
        return !event.metaKey && ((!event.ctrlKey && !ctrlTrigger) || (ctrlTrigger && event.ctrlKey));
    },
    handler: ({ item }) => execActionFx(item)
});

/**
 * Prevent the single click actions from being executed twice
 * Moved Mendix implementation because the click handler implemented by Mendix is refreshed when CTRL clicking a cell.
 * This causes a single click to be executed twice.
 * @param cah
 */
const preventDoubleExecution = (cah:ClickActionHelper):boolean=> {
    const awaitTime = 320; // ms, approx 1/3 of a second
    let startTime = cah.lastClick;
    if (Date.now() - startTime > awaitTime) {
        cah.setLastClick(Date.now());
        return true;
    } else {
        cah.setLastClick(0);
        return false;
    }
}

export function createRowActionHandlers(
    clickActionHelper: ClickActionHelper
): Array<ElementEntry<CellContext, HTMLDivElement>> {
    switch (clickActionHelper.clickTrigger) {
        case "single":
            return [onClick(clickActionHelper)];
        case "double":
            return [onDoubleClick(clickActionHelper.onExecuteAction, clickActionHelper.ctrlTrigger)];
        default:
            return [];
    }
}
