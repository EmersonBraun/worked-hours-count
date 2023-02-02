import axios from 'axios'

export default ({ app, router, store }) => {
    app.use(axios)
}