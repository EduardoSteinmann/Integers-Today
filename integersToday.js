const operations = 
{ 
  0 : function(a, b){ return a * b; }, 
  1 : function(a, b){ return a - b; }, 
  2 : function(a, b){ return a + b; }, 
  3 : function(a, b){ return Math.floor(a / b); }, 
};

const NUM_OF_ANSWER_CHOICES = 6;
const NUM_OF_OPERATORS = 5;

class DigitsAnswer
{
  constructor()
  {
    this.htmlDigits = [];
    this.rawDigits = [];
    this.COMPLETE_ANSWER = 3;
  }  

  addDigit(digit)
  {
    digit.className = "selected-digit";
    this.rawDigits.push(digit.innerHTML * 1);
    this.htmlDigits.push(digit);
  }

  resetAnswer()
  {
    for (let i = 0; i < this.htmlDigits.length; i++)
    {
      this.htmlDigits[i].className = this.htmlDigits[i].className.replace("selected-", "");
    }

    this.rawDigits = [];
    this.htmlDigits = [];
  }

  submitAnswer()
  {
    const answerReady = this.rawDigits.length == this.COMPLETE_ANSWER;
    if (answerReady)
    {
      const initialDigit = this.htmlDigits[0];
      const digitToAlter = this.htmlDigits[2];
      const operator = this.rawDigits[1];
      const answer = operations[operator](this.rawDigits[0], this.rawDigits[2]);
      if (answer < 0)
      {
        this.resetAnswer();
        return;
      }
      digitToAlter.innerHTML = answer;
      initialDigit.innerHTML = '';
      
      this.resetAnswer();
    }
    return answerReady;
  }

  addOperator(operator, level)
  {
    if (operator.innerText == "<-")
    {
      this.resetAnswer();
      level.renderDigitsLevel();
      return;
    }
    else if (this.rawDigits.length == 0)
    {
      return;
    }
    const operators = { '*' : 0, '-' : 1, '+' : 2, '/' : 3 };
    operator.className = "selected-operator";
    this.rawDigits.push(operators[operator.innerHTML]);
    this.htmlDigits.push(operator);
  }
}

class PRNG
{
  constructor(seed)
  {
    this.modulus = 0x80000000;
    this.multiply = 1103515245;
    this.add = 12345;
    this.seed = seed;
  }

  nextInt()
  {
    this.seed = (this.multiply * this.seed + this.add) % this.modulus;
    return this.seed;
  }

  nextFloat()
  {
    return this.nextInt() / (this.modulus - 1);
  }

  nextRange(start, end)
  {
    const range_size = end - start;
    const random = this.nextInt() / this.modulus;
    return start + Math.floor(random * range_size);
  }
}

function getSeedFromDate()
{
  const today = new Date();
  const year = new PRNG(today.getFullYear()).nextInt();
  const month = new PRNG(today.getMonth() + 1).nextInt();
  const day = new PRNG(today.getDate()).nextInt();
  return year + month + day;
}

function generateDigitsLevel(lowerBoundForAnswerChoices, upperBoundForAnswerChoices, lowerBoundForTarget, upperBoundForTarget)
{
  const answerChoices = [];
  const digitsLevel = [];
  const prng = new PRNG(getSeedFromDate());

  for (let i = 0; i < NUM_OF_ANSWER_CHOICES; i++)
  {
    const digit = prng.nextRange(lowerBoundForAnswerChoices, upperBoundForAnswerChoices);
    if (answerChoices.includes(digit)) 
    { 
      i--;
      continue;
    }
    answerChoices.push(digit);
  }

  let total = 0;
  do
  {
    total = answerChoices[0];
    for (let i = 1; i < NUM_OF_ANSWER_CHOICES; i++)
    {
      const val = operations[prng.nextRange(0, 4)](total, answerChoices[i]);
      if (val < 0)
      {
        i--;
        continue;
      }
      total += val;
    }
  } while (total < lowerBoundForTarget || total > upperBoundForTarget || answerChoices.includes(total));

  digitsLevel.push(total);
  digitsLevel.push(answerChoices);

  return digitsLevel;
}

function generateDailyLevels()
{
  const levels = [];
  levels.push(generateDigitsLevel(1, 10, 50, 100));
  levels.push(generateDigitsLevel(1, 15, 100, 300));
  levels.push(generateDigitsLevel(1, 20, 300, 400));
  levels.push(generateDigitsLevel(1, 20, 400, 500));
  return levels;
}

class DigitsLevel
{
  constructor(level, htmlDigits, htmlOperators, htmlTarget)
  {
    this.unalteredLevel = level;
    this.htmlDigits = htmlDigits;
    this.htmlOperators = htmlOperators;
    this.htmlTarget = htmlTarget;
  }

  updateLevel(level)
  {
    this.unalteredLevel = level;
    this.renderDigitsLevel();
  }

  renderDigitsLevel()
  {
    this.htmlTarget.innerHTML = this.unalteredLevel[0];
    const digits = this.unalteredLevel[1];
    for (let i = 0; i < NUM_OF_ANSWER_CHOICES; i++)
    {
      this.htmlDigits[i].innerHTML = digits[i];
    }
  }

  wonLevel(userUpdatedDigit)
  {
    const target = this.htmlTarget.innerHTML * 1;
    const digit = userUpdatedDigit.innerHTML * 1;
    return target == digit;
  }
}

function game(digitsLevels)
{
  let currentLevelIndex = 0;
  const htmlDigits = document.getElementsByClassName("digit");
  const htmlTarget = document.getElementsByClassName("target")[0];
  const htmlOperators = document.getElementsByClassName("operator");
  const currentLevel = new DigitsLevel(digitsLevels[currentLevelIndex], htmlDigits, htmlOperators, htmlTarget);
  const userAnswer = new DigitsAnswer();
  currentLevel.renderDigitsLevel();
  
  function clickOperator(htmlOperator)
  {
    return function()
    {
      userAnswer.addOperator(htmlOperator, currentLevel);
    }
  }

  function clickDigit(htmlDigit)
  {
    return function()
    {
      userAnswer.addDigit(htmlDigit);
      const answerSubmitted = userAnswer.submitAnswer();
      if (answerSubmitted && currentLevel.wonLevel(htmlDigit))
      {
        currentLevelIndex++;
        currentLevel.updateLevel(digitsLevels[currentLevelIndex]);
      }
    }
  }

  for (let i = 0; i < NUM_OF_ANSWER_CHOICES; i++)
  {
    htmlDigits[i].addEventListener("click", clickDigit(htmlDigits[i]));
  }

  for (let i = 0; i < NUM_OF_OPERATORS; i++)
  {
    htmlOperators[i].addEventListener("click", clickOperator(htmlOperators[i]));
  }
}

game(generateDailyLevels());
