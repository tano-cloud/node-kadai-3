
const { resolveInclude } = require('ejs');
const express = require('express');
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('db-dev.sqlite3');
const app = express();
const PORT = 3000;
const fs = require('fs')

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
            const db_column = "update mydata_number set currentNum = ?, currentScore = ?"
            db.serialize(() => {
                db.run(db_column, Num, Score)
            })
            return [Num, Score]
        }
        else {
            const Num = currentNum + 1
            const Score = currentScore
            const db_column = "update mydata_number set currentNum = ?, currentScore = ?"
            db.serialize(() => {
                db.run(db_column, Num, Score)
            })
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
            dataNumber['correct_answer'], dataNumber['incorrect_answer_1'], dataNumber['incorrect_answer_2'], dataNumber['incorrect_answer_3']
        ]);
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
                        db.serialize(() => {
                            db.run('delete from mydata')
                            db.run('delete from mydata_number')
                        })
                        const data_results = data['results']
                        for (let i = 0; i < data_results.length; i++) {
                            const number = i;
                            const category = data_results[i]['category'];
                            const difficulty = data_results[i]['difficulty'];
                            const question = data_results[i]['question'];
                            const correct_answer = data_results[i]['correct_answer'];
                            const incorrect_answer_1 = data_results[i]['incorrect_answers'][0];
                            const incorrect_answer_2 = data_results[i]['incorrect_answers'][1];
                            const incorrect_answer_3 = data_results[i]['incorrect_answers'][2];

                            db.serialize(() => {
                                db.run('insert into mydata(number, category, difficulty, question, correct_answer, incorrect_answer_1, incorrect_answer_2, incorrect_answer_3) values(?, ?, ?, ?, ?, ?, ?, ?)', number, category, difficulty, question, correct_answer, incorrect_answer_1, incorrect_answer_2, incorrect_answer_3)
                            })
                        }

                        db.serialize(() => {
                            db.run('insert into mydata_number(currentNum, currentScore, number) values(?, ?, ?)', 0, 0, 1)
                        })

                        db.serialize(() => {
                            db.all("select * from mydata", (err, rows) => {

                                const formattedData = new FormattedData();
                                const displayData = formattedData.displayData(rows, 0)
                                const data_obj = {
                                    title: 'startQuiz',
                                    content_top: displayData[0],
                                    content_middle: displayData[1],
                                    content_bottom: displayData[2],
                                }
                                resolve(data_obj)
                            })
                        })
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
            db.serialize(() => {
                db.all("select * from mydata_number", (err, rows) => {
                    const judgementData = formattedData.judgementAnswer(req, rows[0]['currentNum'], rows[0]['currentScore'])
                    db.all("select * from mydata", (err, column) => {
                        if (judgementData[0] === 10) {
                            const data_obj = {
                                title: 'finish',
                                content_top: `<h2>あなたの正答数は${judgementData[1]}です！！</h2>`,
                                content_middle: '再度チャレンジしたい場合は以下をクリック！！',
                                content_bottom: '<a  href="/" style="border: solid 1px black; padding: 5px; color:black; background-color:#EFEFEF; text-decoration:none" ;type="button">ホームに戻る</a>'
                            }
                            resolve(data_obj)
                            return
                        }
                        const formattedData = new FormattedData();
                        const displayData = formattedData.displayData(column, judgementData[0])
                        const data_obj = {
                            title: 'startQuiz',
                            content_top: displayData[0],
                            content_middle: displayData[1],
                            content_bottom: displayData[2],
                        }
                        resolve(data_obj)
                    })
                })
            })
        })
    },
}
