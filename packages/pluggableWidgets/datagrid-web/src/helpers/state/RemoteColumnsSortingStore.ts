import { ColumnId } from "../../typings/GridColumn";
import { action, makeObservable, observable } from "mobx";
import { SortDirection } from "../../typings/sorting";

import { IColumnSortingStore } from "./ColumnsSortingStore";

import { ActionValue, EditableValue } from "mendix";
import { DatagridContainerProps } from "../../../typings/DatagridProps";
import { QueryController } from "../../controllers/query-controller";

export interface ICustomColumnSortingStore extends IColumnSortingStore {
    sortAttribute?: EditableValue<string>;
    sortAscending?: EditableValue<boolean>;
    sortChangedAction?: ActionValue;
    setSortProperty: (sortProperty: string) => void;
}
export type RemoteSortRule = [columnId: ColumnId, sortAsc: SortDirection, sortProperty: string];
export class RemoteColumnsSortingStore implements ICustomColumnSortingStore {
    rules: RemoteSortRule[] = [];
    sortAttribute?: EditableValue<string>;
    sortAscending?: EditableValue<boolean>;
    sortChangedAction?: ActionValue;
    private sortPropertyUpdate: string;
    private query: QueryController;

    constructor(
        initialRules: RemoteSortRule[],
        query: QueryController,
        sortAttribute?: EditableValue<string>,
        sortAscending?: EditableValue<boolean>,
        sortChangedAction?: ActionValue
    ) {
        this.rules = initialRules;
        this.sortAttribute = sortAttribute;
        this.sortAscending = sortAscending;
        this.sortChangedAction = sortChangedAction;
        this.sortPropertyUpdate = "";
        this.query = query;
        makeObservable(this, {
            rules: observable.struct,

            toggleSort: action
        });
    }
    public updateProps(
        props: Pick<DatagridContainerProps, "columns" | "sortAscending" | "sortAttribute" | "onSortChangedAction">
    ): void {
        this.sortAttribute = props.sortAttribute;
        this.sortAscending = props.sortAscending;
        this.sortChangedAction = props.onSortChangedAction;
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
            this.sortAttribute?.setValue(this.sortPropertyUpdate);
            this.sortAscending?.setValue(true);
            this.executeChangedAction();
            this.query.refresh();
            this.rules = [[columnId, "asc", this.sortPropertyUpdate]];
            return;
        }
        if (dir === "asc") {
            // sorted by asc, flip to desc
            this.sortAttribute?.setValue(this.sortPropertyUpdate);
            this.sortAscending?.setValue(false);
            this.executeChangedAction();
            this.query.refresh();
            this.rules = [[columnId, "desc", this.sortPropertyUpdate]];
            return;
        }
        // sorted by desc, disable
        this.sortPropertyUpdate = "";
        this.sortAttribute?.setValue(this.sortPropertyUpdate);
        this.query.refresh();
        this.executeChangedAction();
        this.rules = [];
    }
    executeChangedAction() {
        this.query.refresh();
        if (this.sortChangedAction) {
            this.sortChangedAction.execute();
        }
    }
}
