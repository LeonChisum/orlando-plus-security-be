import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { getSelectedShow } from "../../actions/showActions";

export const ShowCalendar = (props) => {
  const dispatch = useDispatch();
  const show = props.show;

  const location = useLocation();
  const { selectedShow } = location.state;

  useEffect(() => {
    console.log(props);
    // const retrieveShow = () => {
    //   dispatch(getSelectedShow(show));
    // };
    // retrieveShow();
  }, []);

  return (
    <div>
      <p>{selectedShow}</p>
    </div>
  );
};

const mapStateToProps = (state) => ({
  show: state.showReducer.show,
  isLoading: state.showReducer.isLoading,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(ShowCalendar);
