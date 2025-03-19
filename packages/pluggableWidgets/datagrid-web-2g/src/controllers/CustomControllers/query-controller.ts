import {QueryController} from "../query-controller";

export interface CustomQueryController extends QueryController {

    startLoad(): void;
    stopLoad(): void;
}
