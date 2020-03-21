const dateUtils = {
    convertSeconds(sec) {
        let hrs = Math.floor(sec / 3600);
        let min = Math.floor((sec - (hrs * 3600)) / 60);
        let seconds = sec - (hrs * 3600) - (min * 60);
        seconds = Math.round(seconds * 100) / 100

        let fHr = this.formatTwoDigit(hrs)
        let fMin = this.formatTwoDigit(min)
        let fSec = this.formatTwoDigit(seconds)
        return `${fHr}:${fMin}:${fSec}`;
    }, 
    formatTwoDigit(val) {
        if(val < 10) return `0${val}`
        return val
    }   
} 
export default dateUtils