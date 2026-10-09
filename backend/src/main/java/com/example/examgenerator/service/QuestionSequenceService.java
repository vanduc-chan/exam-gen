package com.example.examgenerator.service;

import com.example.examgenerator.entity.QuestionSequence;
import com.example.examgenerator.repository.QuestionSequenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionSequenceService {

    private final QuestionSequenceRepository sequenceRepository;
    @Transactional
    public synchronized Long getNextSequenceValue(String sequenceName) {
        QuestionSequence sequence = sequenceRepository.findBySequenceNameWithLock(sequenceName)
                .orElseGet(() -> {
                    QuestionSequence newSeq = QuestionSequence.builder()
                            .sequenceName(sequenceName)
                            .currentValue(1000L) // Start at 1000 to avoid conflicts with existing data
                            .build();
                    return sequenceRepository.saveAndFlush(newSeq);
                });

        Long nextVal = sequence.getCurrentValue() + 1;
        sequence.setCurrentValue(nextVal);
        sequenceRepository.saveAndFlush(sequence);
        return nextVal;
    }
}
