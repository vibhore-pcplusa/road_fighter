const trees = {};
const images = {};
const controlImgs = {};

const spriteFiles = {
  mycar: "mycar.png",
  red: "red_car.png",
  blue: "blue_car.png",
  green: "green_car.png",
  gadda: "gadda.png"
};

export function loadTreeImages() {
  for (let i = 1; i <= 6; i++) {
    trees[`t${i}`] = new Image();
    trees[`t${i}`].src = `./assets/trees/t${i}.png`;
  }
  return trees;
}

export function loadSprites() {
  for (const key in spriteFiles) {
    images[key] = new Image();
    images[key].src = "./assets/" + spriteFiles[key];
  }
  attachRetryToMycar();
  return images;
}

export function loadControlImages() {
  ['up', 'down', 'left', 'right'].forEach(k => {
    controlImgs[k] = new Image();
    controlImgs[k].src = `./assets/${k}.jpg`;
  });
  return controlImgs;
}

function attachRetryToMycar() {
  if (images.mycar) {
    images.mycar._retryCount = 0;
    (function attachRetry(img) {
      function handleError() {
        if (img._retryCount < 2) {
          img._retryCount++;
          const base = img.src.split('?')[0];
          img.src = base + '?r=' + Date.now();
        } else {
          img.removeEventListener('error', handleError);
        }
      }
      function handleLoad() {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      }
      img.addEventListener('error', handleError);
      img.addEventListener('load', handleLoad);
    })(images.mycar);
  }
}

export function getTrees() {
  return trees;
}

export function getImages() {
  return images;
}

export function getControlImages() {
  return controlImgs;
}

export function getAllAssets() {
  const imgs = [];
  for (let i = 1; i <= 6; i++) imgs.push(trees[`t${i}`]);
  for (const k in images) imgs.push(images[k]);
  for (const k in controlImgs) imgs.push(controlImgs[k]);
  return imgs;
}
