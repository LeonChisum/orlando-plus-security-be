const initialState = {
    currentAdmin: {}
}

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case "LOGIN_SUCESS":
            return {
                ...state,
                currentAdmin: action.payload
            }
        default: return state
    }
}

export default authReducer