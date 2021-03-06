const { User, Emotion } = require("../models");
const { sendFriendAlert } = require('../utils/firebase/notification');

const sendNotification = async (user) => {
    try {
        let friendTokens = [];
        for (let friendId of user.friends) {
            let friend = await User.findOne({ _id: friendId });
            friendTokens = friendTokens.concat(friend.deviceTokens);
        }

        let message = `Your friend ${user.name} is feeling unwell recently!`;
        sendFriendAlert(friendTokens, message);
    } catch (err) {
        console.log("Error", err);
    }
}

const emotionMonitor = async (user) => {
    try {
        const emotion = await Emotion.findOne({ _id: user.emotion });
        if (!emotion)
            return;
        let prev24Hrs = new Date(); prev24Hrs.setHours(prev24Hrs.getHours() - 24);
        console.log("Emotion", emotion);
        let dataArr = emotion.data.reverse();

        let neg = 0, total = 0;

        for (let arr of dataArr) {
            let date = new Date(arr[0]);
            total++;
            if (date.getTime() < prev24Hrs.getTime())
                return;

            if (arr[1] == 'Angry' ||
                arr[1] == 'Disgust' || arr[1] == 'Sad')
                neg++;

            if (neg / total > 0.75)
                break;

        }
        console.log("Neg", neg);
        console.log("Total", total);
        sendNotification(user);
    } catch (err) {
        console.log("Error", err);
    }
}

exports.startMonitor = async (req, res) => {
    try {
        const users = await User.find();
        console.log("Users", users);
        for (let user of users) {
            emotionMonitor(user);
        }
    } catch (err) {
        console.log("Error", err);
    }
}
