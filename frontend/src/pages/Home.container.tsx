import React, { useEffect } from 'react';
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../store";

const HomeContainer: React.FC = () => {
    const userState = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userState?.isAuthenticated) {
            navigate('/login');
        }
    }, [userState?.isAuthenticated, navigate]);

    return (
        <>
            <h1>Hello from Home</h1>
        </>
    )
}

export default HomeContainer;
