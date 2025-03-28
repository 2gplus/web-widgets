import { ColumnId } from "../../typings/GridColumn";
import {action, makeObservable} from "mobx";
import { SortDirection } from "../../typings/sorting";

import { IColumnSortingStore } from "./ColumnsSortingStore";

import { ActionValue, EditableValue } from "mendix";
import { DatagridContainerProps } from "../../../typings/DatagridProps";
import {CustomQueryController} from "../../controllers/CustomControllers/query-controller";




export interface ICustomColumnSortingStore extends IColumnSortingStore {
    sortAttribute?: EditableValue<string>;
    sortAscending?: EditableValue<boolean>;
    sortChangedAction?: ActionValue;
    setSortProperty: (sortProperty: string) => void;
    getSortRules: () => RemoteSortRule[];
}
export type RemoteSortRule = [columnId: ColumnId, sortAsc: SortDirection, sortProperty: string];
export class RemoteColumnsSortingStore implements ICustomColumnSortingStore {

    rules: RemoteSortRule[] = [];
    sortAttribute?: EditableValue<string>;
    sortAscending?: EditableValue<boolean>;
    sortChangedAction?: ActionValue;
    onSortActionControlsDataReload:boolean;

    constructor(
        initialRules: RemoteSortRule[],
        query: CustomQueryController,
        onSortActionControlsDataReload:boolean,
        sortAttribute?: EditableValue<string>,
        sortAscending?: EditableValue<boolean>,
        sortChangedAction?: ActionValue,

    ) {
        this.rules = initialRules;
        this.sortAttribute = sortAttribute;
        this.sortAscending = sortAscending;
        this.sortChangedAction = sortChangedAction;
        this.onSortActionControlsDataReload = onSortActionControlsDataReload;
        this.sortPropertyUpdate = "";
        this.query = query;
        makeObservable(this, {

            toggleSort: action,
            getSortRules:action,

            // rules: observable
        });
    }

    public getSortRules = (): RemoteSortRule[] => {
        return this.rules;
    }
    private sortPropertyUpdate: string;

    private query: CustomQueryController;
    public updateProps(
        props: Pick<DatagridContainerProps, "columns" | "sortAscending" | "sortAttribute" | "onSortChangedAction" | "onSortActionControlsDataReload">
    ): void {
        this.sortAttribute = props.sortAttribute;
        this.sortAscending = props.sortAscending;
        this.sortChangedAction = props.onSortChangedAction;
        this.onSortActionControlsDataReload = props.onSortActionControlsDataReload;

    }

    getDirection(columnId: ColumnId): [SortDirection, number] | undefined {
        const ruleIndex = this.rules.findIndex(r => r[0] === columnId);
        if (ruleIndex === -1) {
            return undefined;
        }
        const [, dir] = this.rules.at(ruleIndex)!;

        return [dir, ruleIndex + 1];
    }
    setSortProperty(sortProperty: string): void {
        this.sortPropertyUpdate = sortProperty;
    }

    toggleSort(columnId: ColumnId): void {
        const [[cId, dir] = []] = this.rules;
        if (!cId || cId !== columnId) {
            // was not sorted or sorted by a different column
            this.updateSortProperty(true,this.sortPropertyUpdate,[[columnId, "asc", this.sortPropertyUpdate]]);
            return;
        }
        if (dir === "asc") {
            // sorted by asc, flip to desc
            this.updateSortProperty(false,this.sortPropertyUpdate,[[columnId, "desc", this.sortPropertyUpdate]]);
            return;
        }
        // sorted by desc, disable
        this.sortPropertyUpdate = "";
        this.updateSortProperty(true,this.sortPropertyUpdate,[]);
    }

    updateSortProperty(sortAsc:boolean, sortAttr:string, newSortRules: RemoteSortRule[]): void {
        console.log(`updateSortProperty console watch test`)
        this.sortAscending?.setValue(sortAsc);
        this.sortAttribute?.setValue(sortAttr);
        if (this.sortChangedAction && this.sortChangedAction.canExecute) {
            this.query.startLoad()
            this.sortChangedAction.execute();
            //Save the newSortRules, these are applied when the sortChangedAction .isExecuting boolean is updated from true to false.
            this.rules = newSortRules;
        }
        if(!this.sortChangedAction || (this.sortChangedAction && !this.onSortActionControlsDataReload)) {
            this.rules = newSortRules;
            this.query.refresh();
        }
    }
}
