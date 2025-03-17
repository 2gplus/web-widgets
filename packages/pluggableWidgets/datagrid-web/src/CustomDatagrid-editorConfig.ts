import {hidePropertiesIn, hidePropertyIn, Problem, Properties} from "@mendix/pluggable-widgets-tools";
import {DatagridPreviewProps} from "../typings/DatagridProps";


export const customErrors = (values: DatagridPreviewProps): Problem[] => {
    return [...customCheckSelectionSettings(values), ...customCheckRemoteSorting(values), ...customCheckRemotePaging(values)];
}

const customCheckSelectionSettings = (values: DatagridPreviewProps): Problem[] => {
    const errors: Problem[] = [];
    // 2G widget contains multi event, so throw an error when the default events is still being used.
    // if (values.onClick) {
    //     errors.push({
    //         property: `onClick`,
    //         message:
    //             "Action is removed please move action to Events / Click events. This action will not be executed on click"
    //     });
    // }

    //On rowclick selection we cannot add a rowClickevent on single click
    if (values.itemSelectionMethod === "rowClick") {
        values.rowClickevents.forEach(x => {
            if (x.defaultTrigger === "single" && !x.ctrlTrigger) {
                errors.push({
                    property: "rowClickevents",
                    message:
                        "Button is single click execution but the item selection is set to row click, this action will never be executed."
                });
            }
        });
    }
    return errors;
};

const customCheckRemoteSorting = (values: DatagridPreviewProps): Problem[] => {
    const errors: Problem[] = [];

    if (values.executeSortChangedActionOnStartup) {
        errors.push({
            property: "executeSortChangedActionOnStartup",
            message: "This action is not implemented, please set this to false."
        })
    }


    if (values.sortingType !== "remote") {
        return errors;
    }

    if (!values.sortAttribute) {
        errors.push({
            property: "sortAttribute",
            message: "Sort attribute is required when using remote sorting"
        })
    }
    if (!values.sortAscending) {
        errors.push({
            property: "sortAscending",
            message: "Sort ascending is required when using remote sorting"
        })
    }

    return errors;
}
const customCheckRemotePaging = (values: DatagridPreviewProps): Problem[] => {
    const errors: Problem[] = [];

    if (!values.remotePaging) {
        return errors
    }
    if (values.pagingDisplayType === "pageBased") {

        errors.push({
            property: "pagingDisplayType",
            message: "Paging display pageBased is not implemented"
        })

    }
    if (!values.pagingTotalCount) {
        errors.push({
            property: "pagingTotalCount",
            message: "Paging totalCount is required when using remote paging"
        })
    }
    if (!values.pageNumber) {
        errors.push({
            property: "pageNumber",
            message: "PageNumber is required when using remote paging"
        })
    }
    if (!values.pageSizeAttribute) {
        errors.push({
            property: "pageSizeAttribute",
            message: "PageSizeAttribute is required when using remote paging"
        })
    }

    return errors;
}

// export const customCheckBoilerPlate = (values: DatagridPreviewProps): Problem[] => {
//     const errors: Problem[] = [];
//     return errors;
// }


export const customHideProperties = (values: DatagridPreviewProps,
                                     defaultProperties: Properties,
                                     _platform: "web" | "desktop") => {

    //Hide the default onClick functions when the onClick is no longer set,
    // otherwise the problemcheck function will show an error to tell the users that this action is moved.
    if (!values.onClick) {
        hidePropertiesIn(defaultProperties, values, ["onClick", "onClickTrigger"]);
    }
    // Hide properties that aren't used when remote Paging is active
    if (values.remotePaging) {
        hidePropertiesIn(defaultProperties, values, ["pageSize"]);
    } else {
        hidePropertiesIn(defaultProperties, values, ["pagingAction", "pagingDisplayType", "pagingTotalCount", "pageNumber", "pageSizeAttribute"])
    }

    if (values.sortingType === "remote") {
        //Hide the execute sortchanged since it's not implemented.
        if (!values.executeSortChangedActionOnStartup) {
            hidePropertyIn(defaultProperties, values, "executeSortChangedActionOnStartup");
        }
        hidePropertiesIn(defaultProperties, values, []);
    } else {
        values.columns.forEach((_column, index) => {
            hidePropertyIn(defaultProperties, values, "columns", index, "sortProperty");
            hidePropertiesIn(defaultProperties, values, ["sortAttribute", "sortAscending", "onSortChangedAction", "executeSortChangedActionOnStartup"])
        });
    }
    return defaultProperties;

}

