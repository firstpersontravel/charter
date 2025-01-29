/* eslint-disable no-bitwise,prefer-template,no-mixed-operators  */

export function adjustColorBrightness(colr, amt) {
  const col = colr.slice(1);
  const num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) {
    r = 255;
  } else if (r < 0) {
    r = 0;
  }
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) {
    b = 255;
  } else if (b < 0) {
    b = 0;
  }
  let g = (num & 0x0000FF) + amt;
  if (g > 255) {
    g = 255;
  } else if (g < 0) {
    g = 0;
  }
  return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

// https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
export function lumaForColor(col) {
  const c = col.slice(1); // strip #
  const rgb = parseInt(c, 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff; // extract red
  const g = (rgb >> 8) & 0xff; // extract green
  const b = (rgb >> 0) & 0xff; // extract blue

  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma;
}

export function chooseTextColor(bgCol) {
  const bgLuma = lumaForColor(bgCol);
  return bgLuma < 150 ? '#ffffff' : '#000000';
}
