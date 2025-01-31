import { View } from 'react-native';
import {
  IconButton,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  Text,
  Snackbar,
  List,
} from 'react-native-paper';
import { useTranslation } from 'i18n';
import { GLOBAL } from 'i18n/namespaces';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { service } from 'service';
import { ReportInput } from 'service/reporting';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { RpcError } from 'grpc-web';
import { StyleSheet } from 'react-native';
import Button from '@/components/Button';


const styles = StyleSheet.create({
  modal: {
    backgroundColor: "white",
  },
  input: {
    backgroundColor: "white",
    color: "black",
    marginTop: 10,
  },
});


export interface FlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  className?: string;
}

export default function FlagButton({
  contentRef,
  authorUser,
}: FlagButtonProps) {
  const { t } = useTranslation(GLOBAL);
  const [isOpen, setIsOpen] = useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ReportInput>();

  const {
    data: report,
    error,
    isLoading,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation<Empty, RpcError, ReportInput>(
    (formData) => {
      console.log('formData', formData);
      return service.reporting.reportContent({ ...formData, contentRef, authorUser });
    },
    {
      onSuccess: () => {
        setIsOpen(false);
        resetForm({reason: '', description: ''});
      },
    },
  );

  const handleClose = () => {
    resetForm({reason: '', description: ''});
    resetMutation();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit((data) => {
    reportContent(data);
  });

  const reasonOptions = [
    '',
    t('report.flag.reason.spam'),
    t('report.flag.reason.dating'),
    t('report.flag.reason.external'),
    t('report.flag.reason.commercial'),
    t('report.flag.reason.harassment'),
    t('report.flag.reason.fake'),
    t('report.flag.reason.freeloading'),
    t('report.flag.reason.guidelines_breach'),
    t('report.flag.reason.other'),
  ];

  return (
    <>
      <IconButton
        icon="flag"
        onPress={() => setIsOpen(true)}
        mode="contained-tonal"
        iconColor="#00A398"
        containerColor="transparent"
      />

      <Portal>
        <Snackbar
          visible={!!report}
          onDismiss={() => {}}
          duration={3000}
          wrapperStyle={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000
          }}
          action={{
            label: 'Close',
            onPress: () => {
              resetMutation();
            },
          }}
        >
          {t('report.content.success_message')}
        </Snackbar>

        <Dialog visible={isOpen} onDismiss={handleClose} style={styles.modal}>
          <Dialog.Title>{t('report.flag.title')}</Dialog.Title>
          <Dialog.Content>
            {error && (
              <Text style={{ color: 'red', marginBottom: 10 }}>
                {error.message}
              </Text>
            )}

            <Text>{t('report.flag.explainer')}</Text>

            <Controller
              control={control}
              name="reason"
              defaultValue=""
              rules={{
                validate: (v) => !!v || t('report.flag.reason_required'),
              }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput
                    label={t('report.flag.reason_label')}
                    value={value}
                    onFocus={() => setReasonPickerVisible(true)}
                    right={<TextInput.Icon icon="menu-down" />}
                    style={styles.input}
                  />
                  <HelperText type="error" visible={!!errors?.reason}>
                    {errors?.reason?.message || t('report.flag.reason_helper')}
                  </HelperText>

                  <Portal>
                    <Dialog
                      visible={reasonPickerVisible}
                      onDismiss={() => setReasonPickerVisible(false)}
                      style={styles.modal}
                    >
                      <Dialog.ScrollArea>
                        <List.Section>
                          {reasonOptions.map((option) => (
                            <List.Item
                              key={option}
                              title={option}
                              onPress={() => {
                                onChange(option);
                                setReasonPickerVisible(false);
                              }}
                            />
                          ))}
                        </List.Section>
                      </Dialog.ScrollArea>
                    </Dialog>
                  </Portal>
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              defaultValue=""
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={t('report.flag.description_label')}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  placeholder={t('report.flag.description_helper')}
                  style={styles.input}
                  textColor="black"
                  theme={{
                    colors: {
                         onSurfaceVariant: 'black'
                    }
                }}
                />
              )}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={onSubmit}
              loading={isLoading}
              title={t('submit')}
            />
            <Button
              onPress={handleClose}
              title={t('cancel')}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
