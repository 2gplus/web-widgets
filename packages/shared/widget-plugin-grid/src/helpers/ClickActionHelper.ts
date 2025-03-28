import { useMemo, useEffect } from "react";
import { executeAction } from "@mendix/widget-plugin-platform/framework/execute-action";
import { ListActionValue, ObjectItem } from "mendix";

export type ExecuteActionFx = (item: ObjectItem) => void;

export type ClickTrigger = "single" | "double" | "none";

export class ClickActionHelper {
    constructor(
        private trigger: ClickTrigger,
        private triggerOnCtrl: boolean,
        public lastClick:number,
        private listAction?: ListActionValue | null | object

    ) {
}
    get ctrlTrigger(): boolean {
        return this.triggerOnCtrl;
    }
    get clickTrigger(): ClickTrigger {
        return this.listAction ? this.trigger : "none";
    }

    update(listAction?: ListActionValue | null | object): void {
        this.listAction = listAction;
    }
    setLastClick(time:number):void{
        this.lastClick = time;
    }

    onExecuteAction: ExecuteActionFx = item => {
        if (this.listAction && "get" in this.listAction) {
            executeAction(this.listAction.get(item));
        }
    };
}

interface HelperProps {
    onClickTrigger: ClickTrigger;
    lastClick: number;
    onClick?: ListActionValue | null | object;
    ctrlTrigger?: boolean;
}

export function useClickActionHelper(props: HelperProps): ClickActionHelper {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const clickActionHelper = useMemo(
        () => new ClickActionHelper(props.onClickTrigger, props.ctrlTrigger ?? false, props.lastClick, props.onClick),
        [props.lastClick]
    );

    useEffect(() => {
        clickActionHelper.update(props.onClick);
    });

    return clickActionHelper;
}
