const nams = new Array('a','b','c','d','e','f');

function getShuffledArray(sampleArray){
    return sampleArray.sort(Math.random()-0.5);
}

console.log(getShuffledArray(nams));