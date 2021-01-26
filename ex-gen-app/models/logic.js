
const { resolveInclude } = require('ejs');
const express = require('express');
const fetch = require('node-fetch');
const app = express();

class QuizDataContainer {
    static apiArrayData = "";
    static apiArrayNumber = 0;
    static quizScore = 0;
}

class FormattedQuizData {
    shuffleChoices(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[j], arr[i]] = [arr[i], arr[j]]
        }
        return arr;
    }

    judgementChoice(choice, apiArrayNumber, quizScore) {
        if (choice === 'true') {
            const Num = apiArrayNumber + 1
            const Score = quizScore + 1

            QuizDataContainer.apiArrayNumber = Num;
            QuizDataContainer.quizScore = Score;
            return [Num, Score]
        }
        else {
            const Num = apiArrayNumber + 1
            const Score = quizScore
            QuizDataContainer.apiArrayNumber = Num;
            QuizDataContainer.quizScore = Score;
            return [Num, Score]
        }
    }

    giveQuiz(apiArrayData, apiArrayNumber) {
        const quizData = apiArrayData[apiArrayNumber];
        //問題の番号
        const numberQuestion = apiArrayNumber + 1;
        //ジャンル
        const category = quizData['category'];
        //難易度
        const difficulty = quizData['difficulty'];
        //問題文
        const contentQuestion = quizData['question'];
        //4択の回答をシャッフル
        const quizSet = this.shuffleChoices([
            ...quizData['incorrect_answers'], quizData['correct_answer']]);
        return [numberQuestion, category, difficulty, contentQuestion, quizSet, quizData['correct_answer']]
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

                        let dataList = []
                        for (let i = 0; i < data['results'].length; i++) {
                            dataList.push(data['results'][i])
                        }

                        QuizDataContainer.apiArrayData = dataList;
                        const formattedQuizData = new FormattedQuizData();
                        const giveQuiz = formattedQuizData.giveQuiz(QuizDataContainer.apiArrayData, 0)
                        const dataObj = {
                            title: 'startQuiz',
                            firstContent: giveQuiz[0],
                            secondContent: giveQuiz[1],
                            thirdContent: giveQuiz[2],
                            fourthContent: giveQuiz[3],
                            fiveContent: giveQuiz[4],
                            sixContent: giveQuiz[5]
                        }
                        resolve(dataObj)
                    });
                } else {
                    console.error('通信エラー')
                }
            });
        })
    },

    startQuiz: (req) => {
        return new Promise((resolve, reject) => {
            const formattedQuizData = new FormattedQuizData();
            const judgementData = formattedQuizData.judgementChoice(req, QuizDataContainer.apiArrayNumber, QuizDataContainer.quizScore)

            if (judgementData[0] === 10) {
                QuizDataContainer.apiArrayNumber = 0;
                QuizDataContainer.quizScore = 0;
                const dataObj = {
                    title: 'finish',
                    topContent: judgementData[1],
                    middleContent: '再度チャレンジしたい場合は以下をクリック！！',
                    bottomContent: 'ホームに戻る',
                    judge: 1,
                }
                resolve(dataObj)
                return
            }
                const giveQuiz = formattedQuizData.giveQuiz(QuizDataContainer.apiArrayData, judgementData[0])
                const dataObj = {
                    title: 'startQuiz',
                    firstContent: giveQuiz[0],
                    secondContent: giveQuiz[1],
                    thirdContent: giveQuiz[2],
                    fourthContent: giveQuiz[3],
                    fiveContent: giveQuiz[4],
                    sixContent: giveQuiz[5],
                    judge: 0,
                }
                resolve(dataObj)
        })
    },
}
