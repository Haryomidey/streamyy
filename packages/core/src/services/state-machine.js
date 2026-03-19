import { StreammyError } from "../domain/errors.js";
const transitions = {
    initiated: ["ringing", "cancelled", "failed"],
    ringing: ["accepted", "declined", "missed", "cancelled", "failed"],
    accepted: ["ongoing", "ended", "failed"],
    declined: [],
    missed: [],
    ongoing: ["ended", "failed"],
    ended: [],
    cancelled: [],
    failed: [],
};
export const assertTransition = (currentStatus, nextStatus) => {
    if (currentStatus === nextStatus) {
        return;
    }
    if (!transitions[currentStatus].includes(nextStatus)) {
        throw new StreammyError("INVALID_CALL_TRANSITION", `Cannot move call from ${currentStatus} to ${nextStatus}.`);
    }
};
//# sourceMappingURL=state-machine.js.map