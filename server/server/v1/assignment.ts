import Koa from 'koa';
import Router from 'koa-router';
import Bodyparser from 'koa-bodyparser';
import Cookie from 'koa-cookie';
import { getCurrentDate, isNumber } from './models/meta';

const { AssignmentModel } = require('./models/assignmentModel');
const { AnswerPaperModel } = require('./models/answerPaperModel');
const { userInfo, assignmentArray } = require('../type');

const router = new Router();

router.use(Bodyparser());
router.use(Cookie());

async function calState(assignment: typeof AssignmentModel, user: typeof userInfo) {
  const now = Date.now();
  if ((now - assignment.publishingTime.getTime()) < 0) {
    return 0; // 공개전
  }
  if ((now - assignment.deadline.getTime()) < 0) {
    return 1; // 진행중
  }
  if (String(user.userNumber).charAt(0) === '1') {
    const answers = await AnswerPaperModel
      .find({ professorNumber: user.userNumber, assignmentId: assignment.assignmentId }).exec();
    if (answers === undefined) { return 2; }
    for (let j = 0; j < answers.length; j += 1) {
      for (let i = 0; i < answers[j].answers.length; i += 1) {
        if (answers[j].answers[i].score === -1) {
          return 2; // 마감됨
        }
      }
    }
    return 3;
  }

  const answer = await AnswerPaperModel
    .findOne({ userNumber: user.userNumber, assignmentId: assignment.assignmentId }).exec();

  if (answer === null) {
    return 2;
  }

  for (let i = 0; i < answer.answers.length; i += 1) {
    if (answer.answers[i].score === -1 || !answer) {
      return 2; // 마감됨
    }
  }
  return 3; // 채점완료
}

router.post('/', async (ctx: Koa.Context) => {
  // 과제 생성 api
  const { body } = ctx.request;
  // 유저가 보낸 데이터
  console.log(body);
  if (ctx.role !== '1') { ctx.throw(403, '권한 없음'); }
  // User가 교수가 아닌 경우

  if (body.students === undefined || body.assignmentName === undefined
    || body.publishingTime === undefined || body.deadline === undefined
    || body.questions === undefined) { ctx.throw(400, '잘못된 요청'); }
  // 요청에 학생 목록, 과제이름, 발행시간, 마감기한, 문제가 없는 경우

  if (body.assignmentId === -1) {
    const newAssignment = new AssignmentModel();
    // 새로운 과제 생성

    for (let i = 0; i < body.questions.length; i += 1) {
      body.questions[i].questionId = i;
      // body에서 questionId에 대한 정보가 오지 않기때문에 따로 번호를 지정해준다
      // 0부터 시작
    }

    newAssignment.professorNumber = ctx.user.userNumber;
    // 새로운 과제의 교수 번호는 교수 본인의 userNumber

    newAssignment.students = body.students;
    // 새로운 과제의 학생 목록

    newAssignment.assignmentName = body.assignmentName;
    // 새로운 과제의 과제 이름

    newAssignment.assignmentInfo = body.assignmentInfo;
    // 새로운 과제의 과제 정보

    newAssignment.publishingTime = body.publishingTime;
    // 새로운 과제의 발행 시간

    newAssignment.deadline = body.deadline;
    // 새로운 과제의 마감 기한

    newAssignment.questions = body.questions;
    // 새로운 과제의 문제

    await newAssignment.save();
    console.log('assignment create 완료');
    // DB에 저장

    ctx.body = newAssignment; // 확인용
  } else {
    // 수정 api
    if (!isNumber(body.assignmentId)) { ctx.throw(400, '잘못된 요청'); }
    const prevAssignment = await AssignmentModel
      .findOne({ professorNumber: ctx.user.userNumber, assignmentId: body.assignmentId })
      .exec();
    // 이전에 생성한 과제가 있는지 교수 본인의 userNumber와 과제 이름으로 탐색

    if (prevAssignment === null) { ctx.throw(404, '해당 과제 없음'); }
    prevAssignment.assignmentName = body.assignmentName;
    // 과제 이름 변경

    prevAssignment.students = body.students;
    // 학생 목록 변경

    prevAssignment.assignmentInfo = body.assignmentInfo;
    // 과제 정보 변경

    prevAssignment.publishingTime = body.publishingTime;
    // 발행 시간 변경

    prevAssignment.deadline = body.deadline;
    // 마감 기한 변경

    for (let i = 0; i < body.questions.length; i += 1) {
      body.questions[i].questionId = i;
      // body에서 questionId에 대한 정보가 오지 않기때문에 따로 번호를 지정해준다
      // 0부터 시작
    }

    prevAssignment.questions = body.questions;
    // 문제 목록 변경

    prevAssignment.meta.modifiedAt = getCurrentDate();
    // 수정 날짜 변경

    await prevAssignment.save();
    console.log('assignment update 완료');
    // DB에 저장

    ctx.body = prevAssignment; // 확인용
  }
});

router.get('/', async (ctx: Koa.Context) => {
  // 전체 과제 조회 api
  let takeAssignment: typeof assignmentArray;
  if (ctx.role === '1') {
    takeAssignment = await AssignmentModel.find({ professorNumber: ctx.user.userNumber }).exec();
    // 사용자가 교수일 경우
  } else if (ctx.role === '2') {
    takeAssignment = await AssignmentModel.find({ students: ctx.user.userNumber }).exec();
    // 사용자가 학생일 경우
  }

  if (takeAssignment === undefined) { ctx.throw(404, '과제 없음'); }

  await Promise.all(takeAssignment.map(async (element: typeof assignmentArray) => {
    const t = element;
    t.assignmentState = await calState(t, ctx.user);
    console.log(t.assignmentState);
  }));

  ctx.body = takeAssignment;
});

router.get('/:assignmentId', async (ctx: Koa.Context) => {
  let takeAssignment;
  if (!isNumber(ctx.params.assignmentId)) { ctx.throw(400, '잘못된 요청'); }
  if (ctx.role === '1') {
    takeAssignment = await AssignmentModel
      .findOne({ professorNumber: ctx.user.userNumber, assignmentId: ctx.params.assignmentId })
      .exec();
    // 사용자가 교수일 경우
  } else if (ctx.role === '2') {
    takeAssignment = await AssignmentModel
      .findOne({ students: ctx.user.userNumber, assignmentId: ctx.params.assignmentId }).exec();
    // 사용자가 학생일 경우
  }
  if (takeAssignment === null) { ctx.throw(404, '찾을 수 없음'); }
  takeAssignment.assignmentState = await calState(takeAssignment, ctx.user);
  ctx.body = takeAssignment;
});

router.delete('/:assignmentId', async (ctx: Koa.Context) => {
  // 과제 삭제
  if (!isNumber(ctx.params.assignmentId)) { ctx.throw(400, '잘못된 요청'); }
  if (ctx.role !== '1') { ctx.throw(403, '권한 없음'); }
  // User가 교수가 아닌 경우

  await AssignmentModel
    .deleteOne({ assignmentId: ctx.params.assignmentId, professorNumber: ctx.user.userNumber });
  // group 컬렉션에서 교수 넘버, 그룹 id가 일치하는 그룹 삭제

  ctx.status = 204;
});

export = router;
