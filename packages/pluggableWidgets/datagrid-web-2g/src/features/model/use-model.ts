import { useEventCallback } from "@mendix/widget-plugin-hooks/useEventCallback";
import { debounce } from "@mendix/widget-plugin-platform/utils/debounce";
import { useMemo, useEffect } from "react";
import { DatagridContainerProps } from "../../../typings/DatagridProps";
import { Column } from "../../helpers/Column";
import { GridSettings } from "../../typings/GridSettings";
import { SettingsStorage } from "../storage/base";
import { useSettingsClient } from "../storage/use-settings-client";
import { GridLoader, State } from "./GridLoader";
import { StateChangeFx } from "./use-grid-state";
import { getHash, sortToInst, stateToSettings } from "./utils";
import { ColumnId } from "../../typings/GridColumn";
import { RemoteSortConfig } from "../../Datagrid";
import { ActionValue, EditableValue } from "mendix";

const [writeSettings, abortWrite] = debounce((storage: SettingsStorage, settings: GridSettings) => {
    storage.save(settings);
}, 500);

export function useModel({
    name,
    columns: sourceColumns,
    datasource,
    pageSize,
    pagination: paginationType,
    configurationAttribute,
    sortingType,
    sortAscending,
    sortAttribute,
    onSortChangedAction
}: DatagridContainerProps): {
    initState: State;
    columns: Column[];
    stateChangeFx: StateChangeFx;
} {
    const loader = useMemo(() => new GridLoader(), []);
    const columns = useMemo(() => sourceColumns.map((col, index) => new Column(col, index)), [sourceColumns]);
    const hash = useMemo(() => getHash(columns, name), [name, columns]);
    const settingsClient = useSettingsClient(hash, configurationAttribute);
    const stateChangeFx = useEventCallback<StateChangeFx>((prevState, newState) => {
        if (prevState.filter !== newState.filter) {
            datasource.setFilter(newState.filter);
        }
        if (prevState.executingRemoteSort === true && newState.executingRemoteSort === false) {
            datasource.setSortOrder(sortToInst(newState.sortOrder, columns));
        }
        //2G: sorting on datasource when the sorting type is local, we want to manage the remote sorting ourselves.
        if (prevState.sortOrder !== newState.sortOrder && !newState.executingRemoteSort) {
            switch (sortingType) {
                case "local":
                    datasource.setSortOrder(sortToInst(newState.sortOrder, columns));
                    break;
                case "remote":
                    const ascending: boolean | undefined =
                        newState.sortOrder && newState.sortOrder[0] && newState.sortOrder[0][1]
                            ? newState.sortOrder[0][1] === "asc"
                            : undefined;
                    const columnId: string & { __columnIdTag: never } =
                        newState.sortOrder && newState.sortOrder[0] && newState.sortOrder[0][0]
                            ? newState.sortOrder[0][0]
                            : ("" as ColumnId);
                    let property: string | undefined;
                    if (columnId) {
                        property = columns.find(x => x.columnId === columnId)?.sortProperty;
                    }
                    updateRemoteSortConfig(
                        {
                            ascending,
                            property
                        },
                        { sortAscending, sortAttribute, onSortChangedAction }
                    );
            }
        }

        if (settingsClient.status === "available") {
            const settings = stateToSettings({
                settingsHash: hash,
                name,
                columns: newState.allColumns,
                hidden: newState.hidden,
                columnOrder: newState.columnOrder,
                size: newState.size,
                sortOrder: newState.sortOrder
            });

            writeSettings(settingsClient.settings, settings);
        }
    });

    useEffect(() => abortWrite, []);

    return {
        initState: loader.getInitState(datasource, paginationType, pageSize, columns, settingsClient),
        columns,
        stateChangeFx
    };
}

const updateRemoteSortConfig = (
    newConfig: RemoteSortConfig,
    {
        sortAscending,
        sortAttribute,
        onSortChangedAction
    }: {
        sortAscending: EditableValue<boolean> | undefined;
        sortAttribute: EditableValue<string> | undefined;
        onSortChangedAction: ActionValue | undefined;
    }
) => {
    let changed = false;
    // check if any property is set
    if (newConfig.property) {
        if (newConfig.ascending != null && newConfig.ascending !== sortAscending?.value) {
            console.log("[datagrid2g] sort ascending changed");
            sortAscending?.setValue(newConfig.ascending);
            changed = true;
        }
        if (newConfig.property && newConfig.property !== sortAttribute?.value) {
            console.log("[datagrid2g] sort attribute changed");
            sortAttribute?.setValue(newConfig.property);
            changed = true;
        }
    } else {
        if (sortAttribute?.value) {
            console.log("[datagrid2g] sort reset to undefined");
            sortAttribute?.setValue(undefined);
            changed = true;
        }
    }
    // only execute the changed action when we are started to prevent double loading
    // if (changed && isStarted) {
    if (changed) {
        // clearTimeout(timer.current);
        // timer.current = setTimeout(() => {
        onSortChangedAction?.execute();

        // }, 40);
    }
};
