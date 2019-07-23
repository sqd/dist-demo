function interpolate(a, b, r) {
    return a + (b - a) * r;
}

const utils = new Object();
utils.interpolate = interpolate;

export default utils;