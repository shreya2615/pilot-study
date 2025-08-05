const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true,
  on_finish: function() {
    const rawData = jsPsych.data.get().values();
    const participantID = rawData[0]?.participantID || "unknown";

    const formattedData = rawData.map(trial => {
      const isImage = trial.modality === "image";
      const isAudio = trial.modality === "audio";

      return {
        ParticipantID: trial.participantID || "unknown",
        Group: trial.group || "unknown",
        Block: trial.block || "",
        LeftStimulus: isImage ? trial.image_left : (isAudio ? trial.audio_left : ""),
        RightStimulus: isImage ? trial.image_right : (isAudio ? trial.audio_right : ""),
        Question: trial.question || (trial.responses ? trial.responses.map(r => r.question).join(" | ") : ""),
        Response: trial.response || (trial.responses ? trial.responses.map(r => r.response).join(" | ") : ""),
        ReactionTime: trial.rt || (trial.responses ? trial.responses.map(r => r.rt).join(" | ") : ""),

        BreakDuration: trial.break_duration || ""
      };
    });

    database.ref(`participants/${participantID}/finalData`).set(formattedData);
  }
});

function createEndOfBlockScreen(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="text-align: center; padding: 40px;">
        <h2 style="color: #333;">End of Block ${blockNumber.toUpperCase()}</h2>
        <p>You have completed this section. Take a short break if needed.</p>
        <p><strong>Press SPACE to continue.</strong></p>
      </div>
    `,
    choices: [' ']
  };
}

const group = jsPsych.randomization.sampleWithoutReplacement(["male", "female"], 1)[0];
const participantID = jsPsych.data.getURLVariable("id") || Math.floor(Math.random() * 10000);
jsPsych.data.addProperties({ participantID: participantID });
const blockOrders = [["a", "b", "c"], ["b", "c", "a"], ["c", "a", "b"]];
const blockOrder = blockOrders[participantID % 3];

const imageBlocks = { a: [1, 2, 3], b: [4, 5, 6], c: [7, 8, 9, 10] };
const audioBlocks = { a: [1, 2, 3, 4, 5, 6], b: [7, 8, 9, 10, 11, 12, 13], c: [14, 15, 16, 17, 18, 19, 20] };
const facePairs = [[1, 2], [3, 1], [2, 3], [4, 5], [6, 4], [5, 6]];
const audioPairs = [[1, 2], [1, 3], [2, 3]];
const imageQuestions = [
  "Who looks more dominant?",
  "Who looks more trustworthy?",
  "Who looks more honest?",
  "Who looks taller?",
  "Which image do you find more attractive?"
];

const audioQuestions = [
  "Who sounds more dominant?",
  "Who sounds more trustworthy?",
  "Who sounds more honest?",
  "Who sounds taller?",
  "Which voice do you prefer?",
  "Do these voices sound more human or robotic to you (1 = Human, 2 = Robotic)"
];

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Welcome to the experiment</h2>
    <p>In this study, you will complete a series of tasks involving <strong>images</strong> and <strong>audio clips</strong>.</p>
    <p>There will be 3 blocks in total, Blocks A, B, and C (presented randomly). In each block, you'll first see image pairs and answer 5 questions about each pair, followed by audio pairs with 6 questions per pair.</p>
    <p>You will use the number keys (1 or 2) to respond.</p>
    <p>This experiment will take approximately 45 minutes to complete. Before you begin, please ensure you're in a quiet space.</p>
    <p>If you wish to stop at any point, simply close this page and your data will not be recorded.</p>
    <p><em>Press the spacebar to view examples of the image and audio pairs before you begin the actual experiment.</em></p>
  `,
  choices: [' ']
};

const exampleImageTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h3>Image Pair Example</h3>
    <p><em>Note: The following example images and questions are not part of the actual experiment. They are included only to illustrate how stimuli will be presented.</em></p>
    <p>In the actual study, you will see different image pairs, followed by 5 different questions.</p>
    <div style='display:flex; justify-content:space-around;'>
      <div style='text-align: center;'>
        <p><strong>Image 1</strong></p>
        <img src='all_images/example1.png' height='200'>
      </div>
      <div style='text-align: center;'>
        <p><strong>Image 2</strong></p>
        <img src='all_images/example2.png' height='200'>
      </div>
    </div>
    <p><strong>Example question:</strong> Which image has a dog?</p>
    <p><em>You would press 1 for Image 1 or 2 for Image 2 in the real study.</em></p>
    <p>Press SPACE to continue.</p>
  `,
  choices: [' ']
};

const exampleAudioTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h3>Audio Pair Example</h3>
    <p><em>Note: The following example audios and questions are not part of the actual experiment. They are included only to illustrate how stimuli will be presented.</em></p>
    <p>In the actual study, you will hear different audio pairs, followed by 6 different questions.</p>
    <div style="display: flex; justify-content: center; gap: 50px;">
      <div style='text-align:center;'>
        <p><strong>Audio 1</strong></p>
        <audio controls><source src="all_audios/example1.wav" type="audio/wav"></audio>
      </div>
      <div style='text-align:center;'>
        <p><strong>Audio 2</strong></p>
        <audio controls><source src="all_audios/example2.wav" type="audio/wav"></audio>
      </div>
    </div>
    <p><strong>Example question:</strong> Which speaker is talking faster?</p>
    <p><em>You would press 1 for Audio 1 or 2 for Audio 2 in the real study.</em></p>
    <p>Press SPACE to continue.</p>
  `,
  choices: [' ']
};

const preExperimentInstructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>You will now start the actual experiment.</p>
    <p>Remember to use the number keys (1 or 2) to respond to each question.</p>
    <p>Each block will take approximately 15 minutes to complete.</p>
    <p>Make sure you're in a quiet space and give each question your full attention.</p>
    <p><strong>Press the spacebar to begin the first block.</strong></p>
  `,
  choices: [' ']
};

let timeline = [instructions, exampleImageTrial, exampleAudioTrial, preExperimentInstructions];

blockOrder.forEach(blockKey => {
  const faceNums = imageBlocks[blockKey];
  const audioNums = audioBlocks[blockKey];

  let imageComparisons = [];

  faceNums.forEach(faceNum => {
    const faceID = faceNum.toString().padStart(2, "0");
    facePairs.forEach(([v1, v2]) => {
      imageComparisons.push({
        img1: `${group}_face${faceID}_${v1}.png`,
        img2: `${group}_face${faceID}_${v2}.png`,
        face_number: faceNum
      });
    });
  });

  jsPsych.randomization.shuffle(imageComparisons).forEach(({ img1, img2, face_number }) => {
    imageQuestions.forEach((question, index) => {
      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <p style='font-size:12px;'>BLOCK: ${blockKey.toUpperCase()} (Image)</p>
          <p><b>Please review both images and answer the question below:</b></p>
	  <div style='display:flex; justify-content:space-around; align-items: center;'>
           <div style='text-align: center;'>
            <p><strong>Image 1</strong></p>
            <img src='all_images/${img1}' height='200'>
           </div>
           <div style='text-align: center;'>
            <p><strong>Image 2</strong></p>
            <img src='all_images/${img2}' height='200'>
           </div>
          </div>
          <p><strong>${question}</strong></p>
          <p>Press 1 for Image 1 or 2 for Image 2.</p>
        `,
        choices: ['1', '2'],
        data: {
          modality: "image",
          image_left: img1,
          image_right: img2,
          question: question,
          question_index: index + 1,
          face_number: face_number,
          group: group,
          block: blockKey
        }
      });
    });
  });

  let audioTrials = [];
  audioNums.forEach(audioNum => {
    const audioID = audioNum.toString().padStart(2, "0");
    audioPairs.forEach(([p1, p2]) => {
      const audio1File = `all_audios/${group}_voice${audioID}_pitch${p1}.wav`;
      const audio2File = `all_audios/${group}_voice${audioID}_pitch${p2}.wav`;

      audioTrials.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <div style="text-align:center;">
            <p style="font-size:12px;">BLOCK: ${blockKey.toUpperCase()} (Audio)</p>
            <p><strong>Please listen to each audio recording carefully. After they finish playing, answer the following questions.</strong></p>

            <div style="display: flex; justify-content: center; gap: 50px;">
              <div style="text-align: center;">
               <p><strong>Audio 1</strong></p>
               <audio id="audio1" controls>
                 <source src="${audio1File}" type="audio/wav">
                </audio>
              </div>
              <div style="text-align: center;">
                <p><strong>Audio 2</strong></p>
                <audio id="audio2" controls>
                  <source src="${audio2File}" type="audio/wav">
                </audio>
              </div>
            </div>

            <div id="question-box" style="margin-top:30px;"></div>
            <p id="instructions" style="margin-top:20px;"></p>
           </div>
         `,

        choices: "NO_KEYS",
        on_load: () => {
          const a1 = document.getElementById("audio1");
          const a2 = document.getElementById("audio2");
          const box = document.getElementById("question-box");
          const instr = document.getElementById("instructions");
          let done1 = false, done2 = false;
          let currentQ = 0;
          let responses = [];

          const showNextQuestion = () => {
            if (currentQ < audioQuestions.length) {
              box.innerHTML = `<p><strong>${audioQuestions[currentQ]}</strong></p><p>Press 1 or 2</p>`;
              jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: info => {
                  responses.push({
                    question: audioQuestions[currentQ],
                    response: info.key,
                    rt: info.rt
                  });
                  currentQ++;
                  showNextQuestion();
                },
                valid_responses: ['1', '2'],
                rt_method: 'performance',
                persist: false,
                allow_held_key: false
              });
            } else {
              jsPsych.finishTrial({
                modality: "audio",
                audio_left: audio1File,
                audio_right: audio2File,
                audio_number: audioNum,
                block: blockKey,
                group: group,
                responses: responses
              });
            }
          };

          const checkReady = () => {
            if (done1 && done2) {
              instr.innerHTML = "Press 1 for Audio 1 or 2 for Audio 2.";
              showNextQuestion();
            }
          };

          a1.addEventListener("ended", () => { done1 = true; checkReady(); });
          a2.addEventListener("ended", () => { done2 = true; checkReady(); });
        }
      });
    });
  });

  timeline.push(...jsPsych.randomization.shuffle(audioTrials));

  if (blockKey !== blockOrder[blockOrder.length - 1]) {
    timeline.push(createEndOfBlockScreen(blockKey));
  }
});

timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>Thank you for participating!</h2><p>Your responses have been recorded. You may now close this window.</p>`,
  choices: "NO_KEYS",
  trial_duration: 5000
});

jsPsych.run(timeline);
