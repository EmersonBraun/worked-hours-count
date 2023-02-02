export const updateTime = (state, payload) => {
    state.currTime = payload
}

export const updateDate = (state, payload) => {
    state.currDate = payload
}

export const toogleRunning = (state) => {
    state.running = !state.running
}

