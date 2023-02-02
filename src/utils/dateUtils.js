const SEC_TO_HOURS = 3600
const SEC_TO_MINUTES = 60

const dateUtils = {
    convertSeconds(sec) {
        let hrs = Math.floor(sec / SEC_TO_HOURS);
        let min = Math.floor((sec - (hrs * SEC_TO_HOURS)) / SEC_TO_MINUTES);
        let seconds = sec - (hrs * SEC_TO_HOURS) - (min * SEC_TO_MINUTES);
        seconds = Math.round(seconds * 100) / 100

        let fHr = this.formatTwoDigit(hrs)
        let fMin = this.formatTwoDigit(min)
        let fSec = this.formatTwoDigit(seconds)
        return `${fHr}:${fMin}:${fSec}`;
    },
    formatTwoDigit(val) {
        if (val < 10) return `0${val}`
        return val
    }
}
export default dateUtils