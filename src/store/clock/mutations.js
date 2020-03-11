export const updateTime = (state, payload) => {
    state.currTime = payload
}

export const toogleRunning = (state) => {
    state.running = !state.running
}

