// === Audio Trial with Sequential Questions Under Same Screen ===

const jsPsych = initJsPsych({
  on_finish: () => {
    fetch("https://script.google.com/macros/s/AKfycbxlf2qo2q94se7bWowfgxKXQSXE1Ll3wKmXWvmCv-8cBU8YguYzTcbh2-KxNUvGsoTUQg/exec", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsPsych.data.get().values())
    });
  }
});

const group = jsPsych.randomization.sampleWithoutReplacement(["male", "female"], 1)[0];
const participantID = jsPsych.data.getURLVariable("id") || Math.floor(Math.random() * 10000);
jsPsych.data.addProperties({ participantID: participantID });
const blockOrders = [["a", "b", "c"], ["b", "c", "a"], ["c", "a", "b"]];
const blockOrder = blockOrders[participantID % 3];

const imageBlocks = { a: [1, 2, 3], b: [4, 5, 6], c: [7, 8, 9, 10] };
const audioBlocks = { a: [1, 2, 3, 4, 5, 6], b: [7, 8, 9, 10, 11, 12, 13], c: [14, 15, 16, 17, 18, 19, 20] };
const facePairs = [[1, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 6]];
const audioPairs = [[1, 2], [1, 3], [2, 3]];
const questions = [
  "Who do you think is more dominant?",
  "Who do you think is more trustworthy?",
  "Who do you think is more honest?",
  "Who do you think is taller?"
];

const consent = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>Consent Form</h2><p>By participating, you agree to take part in this study.</p>
    <p><strong>Complete this form before proceeding:</strong><br>
    <a href="https://docs.google.com/forms/d/e/1FAIpQLSekKKNoYVKAJmO7hAJdm-faJbXRo3Yv8LbsFzgvLKDzFORfvg/viewform?usp=header" target="_blank">Click here</a></p>
    <p>Press SPACE to continue or 0 to exit.</p>`,
  choices: [' ', '0'],
  on_finish: data => { if (data.response === 48) jsPsych.endExperiment("You chose not to participate."); }
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>You will first see a pair of audio clips. You must play both before continuing. Then, four questions will appear one-by-one under the audios.</p>
    <p>Use keys 1 or 2 to respond. Press SPACE to begin.</p>`,
  choices: [' ']
};

let timeline = [consent, instructions];

// === Organize Image and Audio Trials by Block ===

blockOrder.forEach(block => {
  let blockImageTrials = [];
  let blockAudioTrials = [];

  imageBlocks[block].forEach(faceNum => {
    facePairs.forEach(([v1, v2]) => {
      const faceID = `${group}_face${String(faceNum).padStart(2, '0')}`;
      const imgLeft = `all_images/${faceID}_${v1}.png`;
      const imgRight = `all_images/${faceID}_${v2}.png`;

      questions.forEach(question => {
        blockImageTrials.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `
            <div style="display: flex; justify-content: center; align-items: center;">
              <img src="${imgLeft}" style="margin-right: 50px; height: 250px;">
              <img src="${imgRight}" style="margin-left: 50px; height: 250px;">
            </div>
            <p>Use keys 1 (left) or 2 (right) to answer the question below:</p>`,
          prompt: question,
          choices: ['1', '2'],
          data: {
            modality: "image",
            group: group,
            block: block,
            image_left: imgLeft,
            image_right: imgRight,
            face_number: faceNum,
            question: question
          },
          on_finish: data => {
            data.response = data.response;
            data.rt = data.rt;
          }
        });
      });
    });
  });

  audioBlocks[block].forEach(audioNum => {
    audioPairs.forEach(([v1, v2]) => {
      const baseID = `${group}_voice${String(audioNum).padStart(2, '0')}`;
      const audioLeft = `all_audios/${baseID}_pitch${v1}.wav`;
      const audioRight = `all_audios/${baseID}_pitch${v2}.wav`;

      blockAudioTrials.push({
        type: jsPsychAudioButtonResponse,
        stimulus: null,
        prompt: `
          <p>Click both buttons to hear the voices. You must play both clips before questions appear.</p>
          <button id="playLeft">Play Left</button>
          <button id="playRight">Play Right</button>
          <div id="questionArea"></div>`,
        choices: [],
        trial_duration: null,
        data: {
          modality: "audio",
          group: group,
          block: block,
          audio_left: audioLeft,
          audio_right: audioRight,
          audio_number: audioNum,
          responses: []
        },
        on_load: () => {
          let leftPlayed = false;
          let rightPlayed = false;

          const leftAudio = new Audio(audioLeft);
          const rightAudio = new Audio(audioRight);

          document.getElementById("playLeft").addEventListener("click", () => {
            leftAudio.play();
            leftPlayed = true;
            checkBothPlayed();
          });

          document.getElementById("playRight").addEventListener("click", () => {
            rightAudio.play();
            rightPlayed = true;
            checkBothPlayed();
          });

          function checkBothPlayed() {
            if (leftPlayed && rightPlayed) {
              displayNextQuestion(0, []);
            }
          }

          function displayNextQuestion(qIndex, responses) {
            if (qIndex >= questions.length) {
              jsPsych.finishTrial({ responses });
              return;
            }

            document.getElementById("questionArea").innerHTML =
              `<p>${questions[qIndex]}</p><p>Press 1 (Left) or 2 (Right)</p>`;

            const listener = jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: (info) => {
                responses.push({
                  question: questions[qIndex],
                  response: info.key,
                  rt: info.rt
                });
                jsPsych.pluginAPI.cancelAllKeyboardResponses();
                displayNextQuestion(qIndex + 1, responses);
              },
              valid_responses: ['1', '2'],
              persist: false,
              allow_held_key: false
            });
          }
        }
      });
    });
  });

  timeline.push(...jsPsych.randomization.shuffle(blockImageTrials));
  timeline.push(...jsPsych.randomization.shuffle(blockAudioTrials));
});
