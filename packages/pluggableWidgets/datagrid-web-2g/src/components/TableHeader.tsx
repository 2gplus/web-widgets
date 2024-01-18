import { createElement, ReactElement, ReactNode } from "react";
import { DynamicValue } from "mendix";

export interface TableHeaderProps {
    pagination:
        | {
              position: string;
              pagination: ReactNode;
          }
        | undefined;
    headerText?: DynamicValue<string>;
    widgets: ReactNode;
    gridHeaderTitle?: string;
}

export function TableHeader(props: TableHeaderProps): ReactElement {
    const hasHeaderText = (): boolean => {
        return (
            props.headerText !== undefined &&
            props.headerText.status === "available" &&
            props.headerText.value.trim().length > 0
        );
    };
    // TODO: fix the table header pulling right when no label is set.
    // TODO: Add error when table label is set and the pagination is not virtual scroll or bottom.
    // TODO: Add functionality for selection to be multi AND be able to set a 'default action' button
    return (
        <div className="table-header" role="rowgroup" style={{ display: "flex" }}>
            {hasHeaderText() ? (
                <div className={"table-label"}>
                    <h4>{props.headerText?.value}</h4>
                </div>
            ) : null}
            {(props.pagination?.position === "top" || props.pagination?.position === "both") && props.pagination ? (
                <div className="table-pagination" role="rowgroup">
                    {props.pagination}
                </div>
            ) : null}
            {props.widgets && (
                <div className="header-filters table-actions" role="rowgroup" aria-label={props.gridHeaderTitle}>
                    {props.widgets}
                </div>
            )}
            {hasHeaderText() ? <hr className={"table-header-line"} /> : null}
        </div>
    );
}
