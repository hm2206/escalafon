const Env = use('Env');

const getUrlFile = (pathString) => {
    return `${Env.get('APP_URL')}/${pathString}`
}


module.exports = {
    getUrlFile
}