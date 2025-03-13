import { PaginationController } from "../PaginationController";
import { ActionValue, EditableValue } from "mendix";
import { Big } from "big.js";
import { PaginationEnum, PagingDisplayTypeEnum, ShowPagingButtonsEnum } from "../../../typings/DatagridProps";
import { DerivedPropsGate } from "@mendix/widget-plugin-mobx-kit/props-gate";
import { ReactiveControllerHost } from "@mendix/widget-plugin-mobx-kit/reactive-controller";

type Gate = DerivedPropsGate<{
    pageSize: number;
    pagination: PaginationEnum;
    showPagingButtons: ShowPagingButtonsEnum;
    showNumberOfRows: boolean;
    pagingAction?: ActionValue;
    pagingDisplayType: PagingDisplayTypeEnum;
    pagingTotalCount: EditableValue<Big>;
    pageNumber: EditableValue<Big>;
    pageSizeAttribute: EditableValue<Big>;
}>;

export class CustomPaginationController extends PaginationController {
    protected gate: Gate;
    constructor(host: ReactiveControllerHost, { gate, query }: any) {
        super(host, { gate, query });
        this.gate = gate;
    }

    setPage = (computePage: (prevPage: number) => number): void => {
        this.updateCurrentPage = computePage(this.currentPageNumber);
    };

    get pageSize(): number {
        return this.currentPageSize;
    }
    get currentPage(): number {
        return this.currentPageNumber;
    }

    get isLastPage(): boolean {
        return this.currentPage + 1 < Math.ceil(this.currentTotalCount / this.pageSize);
    }

    protected setInitParams(): void {
        return;
    }

    set updateCurrentPage(newPage: number) {
        this.gate.props.pageNumber.setValue(new Big(newPage));
        if (this.gate.props.pagingAction) {
            this.gate.props.pagingAction.execute();
        }
        this.query.refresh();
    }

    get currentPageNumber() {
        return this.gate.props.pageNumber.value ? this.gate.props.pageNumber.value.toNumber() : 0;
    }
    get currentPageSize() {
        return this.gate.props.pageSizeAttribute.value ? this.gate.props.pageSizeAttribute.value.toNumber() : 0;
    }
    get currentTotalCount() {
        return this.gate.props.pagingTotalCount.value ? this.gate.props.pagingTotalCount.value.toNumber() : 0;
    }
}
