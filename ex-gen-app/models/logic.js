
const { resolveInclude } = require('ejs');
const express = require('express');
const fetch = require('node-fetch');
const app = express();

class Quiz {
    static dataArray = "";
    static currentNum = 0;
    static currentScore = 0;
}

class FormattedData {
    shuffleAnswer(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[j], arr[i]] = [arr[i], arr[j]]
        }
        return arr;
    }

    judgementAnswer(selectAnswer, currentNum, currentScore) {
        if (selectAnswer === 'true') {
            const Num = currentNum + 1
            const Score = currentScore + 1

            Quiz.currentNum = Num;
            Quiz.currentScore = Score;
            return [Num, Score]
        }
        else {
            const Num = currentNum + 1
            const Score = currentScore
            Quiz.currentNum = Num;
            Quiz.currentScore = Score;
            return [Num, Score]
        }
    }

    displayData(dataArray, currentNum) {
        const dataNumber = dataArray[currentNum];
        //問題〇
        const number = `<h1>問題${currentNum + 1}</h1>`;
        //ジャンル
        const category = '<h2>[ジャンル] ' + dataNumber['category'] + '</h2>';
        //難易度
        const difficulty = '<h2>[難易度] ' + dataNumber['difficulty'] + '</h2>';
        //問題文
        const question = '<div>' + dataNumber['question'] + '</div>';
        //4択の回答をシャッフル
        const quizSet = this.shuffleAnswer([
            ...dataNumber['incorrect_answers'], dataNumber['correct_answer']]);
        //４択の回答
        let quizSet_list = '<form action="/start" method="POST"><div>'
        for (let i = 0; i < quizSet.length; i++) {
            if (quizSet[i] === dataNumber['correct_answer']) {
                quizSet_list += `<button type="submit" name="button" value="true" style="margin-bottom: 10px">${quizSet[i]}</button><br>`
            }
            else {
                quizSet_list += `<button type="submit" name="button" value="false" style="margin-bottom: 10px">${quizSet[i]}</button><br>`
            }
        }
        quizSet_list += '</div></form>'
        return [number + '<br>' + category + difficulty + '<br>', question, quizSet_list]
    }
}

module.exports = {
    displayHome: () => {
        const data = {
            title: 'Home',
            header: 'ようこそ',
            content: '以下のボタンをクリック',
        }
        return new Promise((resolve, reject) => {
            resolve(data);
        })
    },

    loadQuiz: () => {
        return new Promise((resolve, reject) => {
            fetch('https://opentdb.com/api.php?amount=10&type=multiple', {
                method: "GET",
                redirect: "follow"
            }).then(function (resp) {
                if (resp.ok) {
                    resp.json().then(data => {

                        let data_list = []
                        for (let i = 0; i < data['results'].length; i++) {
                            data_list.push(data['results'][i])
                        }

                        Quiz.dataArray = data_list;
                        const formattedData = new FormattedData();
                        const displayData = formattedData.displayData(Quiz.dataArray, 0)
                        const data_obj = {
                            title: 'startQuiz',
                            content_top: displayData[0],
                            content_middle: displayData[1],
                            content_bottom: displayData[2],
                        }
                        resolve(data_obj)
                    });
                } else {
                    console.error('通信エラー')
                }
            });
        })
    },

    startQuiz: (req) => {
        return new Promise((resolve, reject) => {
            const formattedData = new FormattedData();
            const judgementData = formattedData.judgementAnswer(req, Quiz.currentNum, Quiz.currentScore)

            if (judgementData[0] === 10) {
                Quiz.currentNum = 0;
                Quiz.currentScore = 0;
                const data_obj = {
                    title: 'finish',
                    content_top: `<h2>あなたの正答数は${judgementData[1]}です！！</h2>`,
                    content_middle: '再度チャレンジしたい場合は以下をクリック！！',
                    content_bottom: '<a  href="/" style="border: solid 1px black; padding: 5px; color:black; background-color:#EFEFEF; text-decoration:none" ;type="button">ホームに戻る</a>'
                }
                resolve(data_obj)
                return
            }
            
                const displayData = formattedData.displayData(Quiz.dataArray, judgementData[0])
                const data_obj = {
                    title: 'startQuiz',
                    content_top: displayData[0],
                    content_middle: displayData[1],
                    content_bottom: displayData[2],
                }
                resolve(data_obj)
            
        })
    },
}
