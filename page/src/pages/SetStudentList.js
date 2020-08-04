import React from 'react';
import { Grid, Paper, TextField } from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import {PageInfo} from '../components';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

import SettingsIcon from '@material-ui/icons/Settings';
import AddCircleIcon from '@material-ui/icons/AddCircle';

function SetStudentList(props){
    const [open, setOpen] = React.useState(false);
    const [group, setGroup] = React.useState({"class_name":"","students":[]});
    const [added_field, setField] = React.useState([]);

    const professor = 10203040; // professor = user_number;
    let group_list = [];
    
    // api로 professor에 해당하는 그룹 받아오기
    let group1 = {
        "group_id":0,
        "class_name":"수강생 목록 1",
        "students" : [2017920038, 2017920039, 2017920040],
    }
    let group2 = {
        "group_id":1,
        "class_name":"수강생 목록 2",
        "students" : [2017920041, 2017920042, 2017920043],
    }
    let group3 = {
        "group_id":2,
        "class_name":"수강생 목록 3",
        "students" : [2017920045, 2017920046, 2017920047],
    }
    let group4 = {
        "group_id":3,
        "class_name":"수강생 목록 4",
        "students" : [2017920048, 2017920049, 2017920050],
    }
    let group5 = {
        "group_id":4,
        "class_name":"수강생 목록 5",
        "students" : [2017920051, 2017920052, 2017920053],
    }
    group_list.push(group1);
    group_list.push(group2);
    group_list.push(group3);
    group_list.push(group4);
    group_list.push(group5);
    

    const handleOpen = () => {
        setOpen(true);
    };
    
    const handleClose = () => {
        setOpen(false);
        setGroup({"class_name":"","students":[]});
    };
  
    function AddList(){

    }
    
    function AddStudent(){
    }
    
    function setStudentList(group_information){
        let tmp = [{"class_name":"","students":[]}];
        tmp.className=group_information.class_name;
        tmp.students = group_information.students;
        setGroup(tmp);
    }

    return(
        <Grid container direction="column">
            <PageInfo className="student_list_info"
                icon={SettingsIcon}
                mainTitle="수강생 목록 관리"
                subTitle="" />
            <Grid container wrap="wrap" alignItems="center">
                {
                    group_list.map((gr)=>(
                    
                        <Grid flex="3" className="student_list_con">
                            <Paper>
                                <button onClick={(event) => {handleOpen(); setStudentList(gr);}}>{gr.class_name}</button>
                            </Paper>
                        </Grid>
                        )
                    )
                }
                <Grid flex="3" className="student_list_con">
                    <Paper>
                        <AddCircleIcon onClick={handleOpen}/>
                    </Paper>
                </Grid>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                    className="modal">
                    <Paper className="modal_con">
                        <form className="list_field_con">
                            <TextField label="목록 이름" required rows={1} rowsMax={10000} className="modal_input_field" defaultValue={group["class_name"]}></TextField>
                            {
                                group["students"].map((student)=>
                                    <TextField label="학생" required rows={1} rowsMax={10000} className="modal_input_field" defaultValue={student}></TextField>
                                )
                            }
                            <TextField label="학생" required rows={1} rowsMax={10000} className="modal_input_field" ></TextField>
                            <AddCircleIcon onClick={AddStudent}/>
                            <button onclick={AddList}>저장</button>
                        </form>
                    </Paper>
                </Modal>
            </Grid>
        </Grid>
    );
}

export default SetStudentList;