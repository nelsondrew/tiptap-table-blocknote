import { isInTable, selectedRect } from '@tiptap/pm/tables';
import addDuplicateColumn from '../utilities/addDuplicateColumn';
const duplicateColumn = (state, dispatch, withContent = true) => {
    if (!isInTable(state))
        return false;
    if (dispatch) {
        const rect = selectedRect(state);
        dispatch(addDuplicateColumn(state.tr, rect, rect.right, withContent));
    }
    return true;
};
export default duplicateColumn;
