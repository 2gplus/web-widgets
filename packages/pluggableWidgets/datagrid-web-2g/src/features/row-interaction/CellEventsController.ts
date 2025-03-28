import {ElementEntry, ElementProps} from "@mendix/widget-plugin-grid/event-switch/base";
import {eventSwitch} from "@mendix/widget-plugin-grid/event-switch/event-switch";
import {ObjectItem} from "mendix";
import {useMemo} from "react";
import {createActionHandlers} from "./action-handlers";
import {CellContext} from "./base";
import {createSelectHandlers} from "./select-handlers";
import {SelectActionHelper} from "../../helpers/SelectActionHelper";
import {SelectAdjacentFx, SelectAllFx, SelectFx} from "@mendix/widget-plugin-grid/selection";
import { ClickActionHelper, ExecuteActionFx } from "../../helpers/ClickActionHelper";
import {FocusTargetController} from "@mendix/widget-plugin-grid/keyboard-navigation/FocusTargetController";
import {FocusTargetFx} from "@mendix/widget-plugin-grid/keyboard-navigation/base";
import {createFocusTargetHandlers} from "./focus-target-handlers";
import {ClickEntry, ClickEventSwitch} from "@mendix/widget-plugin-grid/event-switch/ClickEventSwitch";
import {createRowActionHandlers} from "./custom-action-handler";

export class CellEventsController {
    constructor(
        private contextFactory: (item: ObjectItem) => CellContext,
        private selectFx: SelectFx,
        private selectAllFx: SelectAllFx,
        private selectAdjacentFx: SelectAdjacentFx,
        private executeActionFx: ExecuteActionFx,
        private focusTargetFx: FocusTargetFx,
        private rowEvents: ClickActionHelper[]
    ) {
    }

    getProps(item: ObjectItem): ElementProps<HTMLDivElement> {
        return eventSwitch(() => this.contextFactory(item), this.getEntries());
    }

    private getEntries(): Array<ElementEntry<CellContext, HTMLDivElement>> {
        const entries = [
            ...createSelectHandlers(this.selectFx, this.selectAllFx, this.selectAdjacentFx),
            ...createActionHandlers(this.executeActionFx),
            ...createFocusTargetHandlers(this.focusTargetFx)
        ];


        const flatBread = this.rowEvents.flatMap(x => createRowActionHandlers(x));
        const doubles = flatBread.filter(x => x.eventName === "onDoubleClick");
        const singles = flatBread.filter(x => x.eventName === "onClick");
        entries.push(...singles);


        const clickEntries = entries.filter(
            (entry): entry is ClickEntry<CellContext, HTMLDivElement> =>
                entry.eventName === "onClick" || entry.eventName === "onDoubleClick"
        );
        const restEntries = entries.filter(
            entry => entry.eventName !== "onClick" && entry.eventName !== "onDoubleClick"
        );
        return [new ClickEventSwitch(clickEntries).getClickEntry(), ...restEntries,...doubles];
    }
}

export function useCellEventsController(
    selectHelper: SelectActionHelper,
    clickHelper: ClickActionHelper,
    focusController: FocusTargetController,
    rowEvents: ClickActionHelper[]
): CellEventsController {
    return useMemo(() => {
        const cellContextFactory = (item: ObjectItem): CellContext => ({
            item,
            pageSize: selectHelper.pageSize,
            selectionType: selectHelper.selectionType,
            selectionMethod: selectHelper.selectionMethod,
            selectionMode: selectHelper.selectionMode,
            clickTrigger: clickHelper.clickTrigger
        });

        return new CellEventsController(
            cellContextFactory,
            selectHelper.onSelect,
            selectHelper.onSelectAll,
            selectHelper.onSelectAdjacent,
            clickHelper.onExecuteAction,
            focusController.dispatch,
            rowEvents
        );
    }, [selectHelper, clickHelper, focusController, rowEvents]);
}
