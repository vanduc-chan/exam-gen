package com.example.examgenerator.exception;

public class InsufficientQuestionsException extends RuntimeException {
    public InsufficientQuestionsException(String message) {
        super(message);
    }
}
